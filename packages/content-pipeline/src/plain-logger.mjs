import pc from 'picocolors';
import { labelForStage } from './pipeline-events.mjs';

export function createPlainLogger({ stdout = process.stdout, stderr = process.stderr } = {}) {
	return function logEvent(event) {
		if (event.type === 'warning') {
			stderr.write(`${pc.yellow('warning')} ${event.message}\n`);
			return;
		}
		if (event.type === 'stage_start') {
			const count = event.total ? ` ${event.total}` : '';
			stderr.write(`${pc.cyan('stage')} ${event.stage}${count}\n`);
			return;
		}
		if (event.type === 'task_tool_start') {
			stderr.write(`${pc.cyan('tool')} ${event.label} ${pc.yellow(event.toolName)}\n`);
			return;
		}
		if (event.type === 'task_tool_failed') {
			stderr.write(`${pc.red('tool failed')} ${event.label} ${pc.yellow(event.toolName)}\n`);
			return;
		}
		if (event.type === 'task_agent_finished') {
			stderr.write(`${pc.dim('agent finished')} ${event.label}\n`);
			return;
		}
		if (event.type === 'task_repair') {
			stderr.write(
				`${pc.yellow('repair')} ${event.label} ${event.kind} validation failed; asking agent to rewrite (${event.attempt}/${event.maxRepairAttempts})\n`
			);
			return;
		}
		if (event.type === 'validation') {
			stdout.write(`Content validation ${event.valid ? 'passed' : 'failed'}: ${event.manifestPath}\n`);
			if (!event.valid) {
				for (const failure of event.failures) {
					stderr.write(`- ${failure}\n`);
				}
			}
			return;
		}
		if (event.type === 'pipeline_end' && event.ok === false && event.error) {
			stderr.write(`${pc.red('failed')} ${event.error}\n`);
			return;
		}
		if (event.type === 'stage_end') {
			stderr.write(`${pc.dim('done')} ${labelForStage(event.stage)}\n`);
		}
	};
}
