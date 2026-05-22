import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getModel } from "@earendil-works/pi-ai";
import {
	AuthStorage,
	createAgentSession,
	ModelRegistry,
  DefaultResourceLoader,
	type AgentSessionEvent,
  SettingsManager,
  SessionManager,
  getAgentDir,
} from "@earendil-works/pi-coding-agent";
import pc from "picocolors";

let assistantStreaming = false;

function status(line: string): void {
	if (assistantStreaming) {
		process.stdout.write("\n");
	}
	process.stderr.write(`${line}\n`);
}

function formatArgs(args: unknown): string {
	if (args == null) return "";
	try {
		const text = JSON.stringify(args);
		return text.length > 80 ? `${text.slice(0, 77)}…` : text;
	} catch {
		return String(args);
	}
}

function extractText(content: unknown): string | undefined {
	if (!Array.isArray(content)) return undefined;
	return content
		.filter(
			(part): part is { type: "text"; text: string } =>
				typeof part === "object" &&
				part !== null &&
				"type" in part &&
				part.type === "text" &&
				"text" in part &&
				typeof part.text === "string",
		)
		.map((part) => part.text)
		.join("");
}

function truncate(text: string, max: number): string {
	return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function handleEvent(event: AgentSessionEvent): void {
	switch (event.type) {
		case "message_update":
			if (event.assistantMessageEvent.type === "text_delta") {
				process.stdout.write(event.assistantMessageEvent.delta);
				assistantStreaming = true;
			}
			if (event.assistantMessageEvent.type === "thinking_delta") {
				process.stderr.write(pc.dim(event.assistantMessageEvent.delta));
			}
			break;

		case "tool_execution_start": {
			const preview = formatArgs(event.args);
			status(
				`${pc.cyan("▶")} ${pc.bold("tool")} ${pc.yellow(event.toolName)}` +
					(preview ? ` ${pc.dim(preview)}` : ""),
			);
			break;
		}
		// case "tool_execution_update": {
		// 	const text = extractText(event.partialResult?.content);
		// 	if (text) {
		// 		status(pc.dim(`  ${event.toolName}: ${truncate(text, 120)}`));
		// 	}
		// 	break;
		// }
		case "tool_execution_end":
			status(
				`${event.isError ? pc.red("✗") : pc.green("✓")} ${pc.bold("tool")} ${pc.yellow(event.toolName)} ${event.isError ? pc.red("failed") : pc.green("done")}`,
			);
			break;

		case "message_start":
			if (event.message.role === "assistant") {
				status(pc.dim("assistant ▸"));
			}
			break;
		case "message_end":
			if (event.message.role === "assistant" && assistantStreaming) {
				process.stdout.write("\n");
				assistantStreaming = false;
			}
			break;

		case "agent_start":
			status(pc.dim("agent started"));
			break;
		case "agent_end":
			status(pc.dim(`agent finished (${event.messages.length} new messages)`));
			break;

		// case "turn_start":
		// 	status(pc.dim("turn started"));
		// 	break;
		// case "turn_end":
		// 	status(
		// 		pc.dim(
		// 			`turn finished (${event.toolResults.length} tool result${event.toolResults.length === 1 ? "" : "s"})`,
		// 		),
		// 	);
		// 	break;

		case "queue_update": {
			const parts: string[] = [];
			if (event.steering.length > 0) {
				parts.push(`${pc.magenta("steering")}: ${event.steering.join(", ")}`);
			}
			if (event.followUp.length > 0) {
				parts.push(`${pc.blue("follow-up")}: ${event.followUp.join(", ")}`);
			}
			if (parts.length > 0) {
				status(parts.join(pc.dim(" · ")));
			}
			break;
		}
		case "compaction_start":
			status(`${pc.yellow("…")} compacting (${event.reason})`);
			break;
		case "compaction_end": {
			const outcome = event.aborted
				? pc.yellow("aborted")
				: event.errorMessage
					? pc.red(event.errorMessage)
					: pc.green("done");
			status(`${pc.yellow("…")} compaction ${outcome}`);
			break;
		}
		case "auto_retry_start":
			status(
				`${pc.yellow("⟳")} retry ${event.attempt}/${event.maxAttempts} in ${event.delayMs}ms ${pc.dim(event.errorMessage)}`,
			);
			break;
		case "auto_retry_end":
			status(
				event.success
					? `${pc.green("⟳")} retry succeeded on attempt ${event.attempt}`
					: `${pc.red("⟳")} retry failed${event.finalError ? `: ${event.finalError}` : ""}`,
			);
			break;
	}
}

/**
 * ----------------------------------------
 * AGENT SETUP
 * ////////////////////////////////////////
 */

const authStorage = AuthStorage.create();
const modelRegistry = ModelRegistry.create(authStorage);
const settingsManager = SettingsManager.inMemory({
  compaction: { enabled: true },
});

const gpt = getModel("openai-codex", "gpt-5.5");
if (!gpt) throw new Error("Model not found");

status(pc.bold(pc.cyan(`Starting agent harness (${gpt.provider}/${gpt.id})`)));

const cwd = "/Users/michaelnixon/Documents/EduKits/Lessons/LiteraryTechniques"
const agentDir = getAgentDir();
const syllabusSystemPrompt = await readFile(
	join(dirname(fileURLToPath(import.meta.url)), "skills", "SYLLABUS.md"),
	"utf-8",
);

const loader = new DefaultResourceLoader({
  cwd,
  agentDir,

  // Disable AGENTS.md context
  agentsFilesOverride: () => ({
    agentsFiles: []
  }),

  // Also lock down other discoverable resources
  skillsOverride: (current) => ({
    ...current,
    skills: []
  }),

  promptsOverride: (current) => ({
    ...current,
    prompts: []
  }),

  systemPromptOverride: () => syllabusSystemPrompt,

  settingsManager,
});

await loader.reload();

const { session } = await createAgentSession({
  cwd,
  resourceLoader: loader,
	model: gpt,
	thinkingLevel: "minimal",
  sessionManager: SessionManager.inMemory(),
  settingsManager,
	authStorage,
	modelRegistry,
});

session.subscribe(handleEvent);

await session.prompt("Write the syllabus to the cwd based on README.md.");

session.dispose();
