import { generateText } from "ai";
import AIConfig from "#utils/database/models/aiConfig";
import { createProviderModel, getActiveProviderConfigs } from "./config";

export const getProviderState = async () => {
	try {
		let config = await AIConfig.findOne();
		if (!config) config = await AIConfig.create({ exhaustedProviders: [] });
		return config;
	} catch {
		return { exhaustedProviders: [] };
	}
};

export const markProviderExhausted = async (provider: string) => {
	try {
		await AIConfig.updateOne({}, { $addToSet: { exhaustedProviders: provider } }, { upsert: true });
	} catch {}
};

export const resetProviders = async () => {
	try {
		await AIConfig.updateOne({}, { $set: { exhaustedProviders: [] } }, { upsert: true });
	} catch {}
};

export const smartGenerateText = async (params: Omit<Parameters<typeof generateText>[0], "model">) => {
	const activeConfigs = getActiveProviderConfigs();
	if (activeConfigs.length === 0) {
		return null;
	}

	const config = await getProviderState();
	const exhausted = new Set(config.exhaustedProviders || []);
	let available = activeConfigs.filter((cfg) => !exhausted.has(cfg.platform));

	if (available.length === 0) {
		await resetProviders();
		available = activeConfigs;
	}

	for (const providerCfg of available) {
		try {
			const model = createProviderModel(providerCfg);
			if (!model) continue;
			console.log(`[AI] Attempting provider: ${providerCfg.platform} (${providerCfg.defaultModel})`);
			const result = await generateText({
				...params,
				model,
			} as Parameters<typeof generateText>[0]);
			return result;
		} catch (error) {
			console.error(`[AI] Provider ${providerCfg.platform} failed:`, (error as Error).message);
			await markProviderExhausted(providerCfg.platform);
		}
	}

	return null;
};
