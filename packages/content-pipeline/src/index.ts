import { getModel } from "@earendil-works/pi-ai";
import { AuthStorage, createAgentSession, ModelRegistry } from "@earendil-works/pi-coding-agent";

console.log("Starting agent harness...");

// Set up credential storage and model registry
const authStorage = AuthStorage.create();
const modelRegistry = ModelRegistry.create(authStorage);

// Find target model
const gpt = getModel("openai-codex", "gpt-5.5");
if (!gpt) throw new Error("Model not found");

const { session } = await createAgentSession({
	model: gpt,
	thinkingLevel: "minimal",
	authStorage,
	modelRegistry
});

session.subscribe((event) => {
	if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
		process.stdout.write(event.assistantMessageEvent.delta);
	}
});

await session.prompt("Tell me a short joke about cats.");

session.dispose();