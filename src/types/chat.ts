export interface MenuSuggestion {
	_id: string;
	name: string;
	price: number;
	image: string;
	veg: "veg" | "non-veg" | "contains-egg";
	description: string;
	category: string;
}

export type ChatAction =
	| { type: "ADD_TO_CART"; items: Array<{ name: string; quantity: number }> }
	| { type: "OPEN_CART" }
	| { type: "PLACE_ORDER"; items?: Array<{ name: string; quantity: number }> };

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	toolResults?: MenuSuggestion[][];
	action?: ChatAction;
	createdAt: number;
}
