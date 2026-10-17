import type { TMenu } from "#utils/database/models/menu";

interface FallbackParams {
	query: string;
	items: TMenu[];
	customerName: string;
	restaurantName: string;
}

export function generateSmartLocalReply({ query, items, customerName, restaurantName }: FallbackParams): { text: string; recNames: string[] } {
	const q = (query || "").toLowerCase().trim();
	const availableItems = items.filter((i) => i.availability !== "sold-out" && !i.hidden);
	const nameOrGuest = customerName && customerName !== "Guest" ? customerName : "";

	// 1. Initial Greeting / "Hey!"
	if (!q || q === "hey!" || q === "hey" || q === "hi" || q === "hello" || q.includes("namaste") || q.includes("start")) {
		const specials = availableItems.filter((i) => i.availability === "todays-special");
		const candidates = specials.length > 0 ? specials : availableItems.slice(0, 4);
		const recNames = candidates.slice(0, 4).map((i) => i.name);

		const greeting = nameOrGuest ? `Hey ${nameOrGuest}!` : "Hey there!";
		return {
			text: `${greeting} I'm Jarvis from ${restaurantName}. How can I delight your tastebuds today? Here are some top picks crafted fresh right now:`,
			recNames,
		};
	}

	// 2. Vegetarian / Pure Veg
	if (q.includes("veg") && !q.includes("non")) {
		const vegItems = availableItems.filter((i) => i.veg === "veg");
		const candidates = vegItems.slice(0, 4);
		return {
			text: `Here are our delicious 100% vegetarian options ready for you:`,
			recNames: candidates.map((i) => i.name),
		};
	}

	// 3. Non-Vegetarian
	if (q.includes("non-veg") || q.includes("non veg") || q.includes("chicken") || q.includes("meat") || q.includes("egg")) {
		const nonVegItems = availableItems.filter((i) => i.veg !== "veg");
		const candidates = nonVegItems.slice(0, 4);
		return {
			text: candidates.length ? `Here are our top non-vegetarian canteen delights:` : `We currently feature all-vegetarian specialties in our menu today!`,
			recNames: candidates.map((i) => i.name),
		};
	}

	// 4. Chef Specials
	if (q.includes("special") || q.includes("today's special") || q.includes("chef")) {
		const specials = availableItems.filter((i) => i.availability === "todays-special");
		const candidates = specials.length > 0 ? specials : availableItems.slice(0, 3);
		return {
			text: `Here are today's featured chef specials from our live kitchen:`,
			recNames: candidates.map((i) => i.name),
		};
	}

	// 5. Budget / Cheap / Affordable
	if (q.includes("cheap") || q.includes("budget") || q.includes("affordable") || q.includes("under") || q.includes("low price")) {
		const sorted = [...availableItems].sort((a, b) => a.price - b.price);
		const candidates = sorted.slice(0, 4);
		return {
			text: `Looking for delicious bites that are light on the pocket? Check these out:`,
			recNames: candidates.map((i) => i.name),
		};
	}

	// 6. Specific category search (Drinks, Beverages, Snacks, Desserts, Meals, etc.)
	const categories = Array.from(new Set(availableItems.map((i) => i.category.toLowerCase())));
	const matchedCat = categories.find((c) => q.includes(c));
	if (matchedCat) {
		const catItems = availableItems.filter((i) => i.category.toLowerCase() === matchedCat);
		return {
			text: `Here are our best <b>${matchedCat.toUpperCase()}</b> selections:`,
			recNames: catItems.slice(0, 4).map((i) => i.name),
		};
	}

	// 7. Keyword matching against dish names and descriptions
	const scored = availableItems
		.map((item) => {
			let score = 0;
			const name = item.name.toLowerCase();
			const desc = (item.description || "").toLowerCase();
			const words = q.split(/\s+/).filter((w) => w.length > 2);

			for (const word of words) {
				if (name.includes(word)) score += 5;
				if (desc.includes(word)) score += 2;
			}
			return { item, score };
		})
		.filter((entry) => entry.score > 0)
		.sort((a, b) => b.score - a.score);

	if (scored.length > 0) {
		const top = scored.slice(0, 4).map((s) => s.item);
		return {
			text: `Here is what I found matching your craving:`,
			recNames: top.map((i) => i.name),
		};
	}

	// 8. General recommendation fallback
	const fallbackCandidates = availableItems.slice(0, 4);
	return {
		text: `I'd love to help you choose! Here are popular canteen favorites right now:`,
		recNames: fallbackCandidates.map((i) => i.name),
	};
}
