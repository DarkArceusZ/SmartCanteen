import { getServerSession } from "next-auth";
import { generateSmartLocalReply } from "#utils/ai/fallback";
import { getSystemPrompt } from "#utils/ai/prompt";
import { smartGenerateText } from "#utils/ai/switcher";
import { getRestaurantData } from "#utils/database/helper/account";
import type { TMenu } from "#utils/database/models/menu";
import { authOptions } from "#utils/helper/authHelper";

export async function POST(req: Request) {
	try {
		const { messages = [], restaurantId } = await req.json();
		if (!restaurantId) return Response.json({ text: "Restaurant ID is required", toolResults: [] }, { status: 400 });

		const session = await getServerSession(authOptions);
		const customerName = session?.customer?.fname || "Guest";

		const name = restaurantId.replace(/\b\w/g, (c: string) => c.toUpperCase()).replace(/[-_]/g, " ");
		const account = await getRestaurantData(restaurantId).catch(() => null);

		if (!account) return Response.json({ text: `Restaurant '${name}' not found`, toolResults: [] }, { status: 404 });

		const items: TMenu[] = account?.menus || [];
		const menuMap = new Map(items.map((i) => [i.name.toLowerCase(), i]));
		const lastUserMsg = [...messages].reverse().find((m: { role: string; content: string }) => m.role === "user")?.content || "";

		let text = "";
		const toolResults: TMenu[][] = [];

		// Attempt Cloud LLM first if API key is provided
		try {
			const result = await smartGenerateText({
				system: getSystemPrompt(name, items, customerName),
				messages,
			});

			if (result?.text) {
				text = result.text;
				const match = text.match(/<<<REC:?(.*?)>>>/);

				if (match) {
					text = text.replace(match[0], "").trim();
					try {
						const names = JSON.parse(match[1]);
						if (Array.isArray(names)) {
							const found = names.map((n: string) => menuMap.get(n.toLowerCase())).filter((i): i is TMenu => !!i);
							if (found.length) toolResults.push(found);
						}
					} catch {}
				}
			}
		} catch (aiErr) {
			console.warn("[AI] Cloud LLM error, falling back to local smart engine:", aiErr);
		}

		// If no cloud LLM response (or no API key configured), use Smart Canteen Local Engine
		if (!text) {
			const fallback = generateSmartLocalReply({
				query: lastUserMsg,
				items,
				customerName,
				restaurantName: name,
			});
			text = fallback.text;
			if (fallback.recNames?.length) {
				const found = fallback.recNames.map((n) => menuMap.get(n.toLowerCase())).filter((i): i is TMenu => !!i);
				if (found.length) toolResults.push(found);
			}
		}

		return Response.json({ text, toolResults });
	} catch (error) {
		console.error("Error in AI Chat API:", error);
		return Response.json({ text: "I'm right here! How can I help you with our menu today?", toolResults: [] }, { status: 200 });
	}
}
