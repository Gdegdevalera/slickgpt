export interface AiModelSettings {
	max_tokens: number; // just for completions
	temperature: number; // 0-2
	top_p: number; // 0-1
	stop?: string | string[]; // max 4 entries in array
}

export interface JanAiModel {
	id: string;
	parameters: AiModelSettings
}

export interface AiSettings extends AiModelSettings {
	model: string;
}
