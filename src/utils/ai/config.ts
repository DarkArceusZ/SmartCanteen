import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export type AIPlatform = "google" | "groq" | "openai" | "cerebras" | "siliconflow";

export interface IPlatformConfig {
	platform: AIPlatform;
	url: string;
	defaultModel: string;
	getApiKey: () => string | undefined;
}

export const platformConfigs: IPlatformConfig[] = [
	{
		platform: "google",
		url: "https://generativelanguage.googleapis.com/v1beta/openai/",
		defaultModel: "gemini-2.0-flash",
		getApiKey: () =>
			process.env.GEMINI_API_KEY?.trim() ||
			process.env.GOOGLE_API_KEY?.trim() ||
			process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
			process.env.AI_GOOGLE_KEY?.trim(),
	},
	{
		platform: "groq",
		url: "https://api.groq.com/openai/v1",
		defaultModel: process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b",
		getApiKey: () =>
			process.env.GROQ_API_KEY?.trim() ||
			process.env.GROK_API_KEY?.trim() ||
			process.env.AI_GROQ_KEY?.trim(),
	},
	{
		platform: "openai",
		url: "https://api.openai.com/v1",
		defaultModel: "gpt-4o-mini",
		getApiKey: () => process.env.OPENAI_API_KEY?.trim() || process.env.AI_OPENAI_KEY?.trim(),
	},
	{
		platform: "cerebras",
		url: "https://api.cerebras.ai/v1",
		defaultModel: "llama-3.3-70b",
		getApiKey: () => process.env.CEREBRAS_API_KEY?.trim() || process.env.AI_CEREBRAS_KEY?.trim(),
	},
	{
		platform: "siliconflow",
		url: "https://api.siliconflow.com/v1",
		defaultModel: "deepseek-ai/DeepSeek-V3",
		getApiKey: () => process.env.SILICONFLOW_API_KEY?.trim() || process.env.AI_SILICONFLOW_KEY?.trim(),
	},
];

export const getActiveProviderConfigs = (): IPlatformConfig[] => {
	return platformConfigs.filter((cfg) => Boolean(cfg.getApiKey()));
};

export const createProviderModel = (cfg: IPlatformConfig) => {
	const key = cfg.getApiKey();
	if (!key) return null;
	const provider = createOpenAICompatible({
		baseURL: cfg.url,
		apiKey: key,
		name: cfg.platform,
	});
	return provider(cfg.defaultModel);
};
