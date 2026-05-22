export type PipelineResult = {
	ok: boolean;
	messages: string[];
};

export const createPipelineResult = (messages: string[] = []): PipelineResult => ({
	ok: messages.length === 0,
	messages
});
