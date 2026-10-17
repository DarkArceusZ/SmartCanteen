export const SITE_NAME = "SmartCanteen AI";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const SITE_DESCRIPTION =
	"Contactless restaurant ordering powered by AI. Scan a QR code, browse the menu, chat with an AI assistant, and place your order — no app download required.";

export const SITE_TAGLINE = "Revolutionizing Dining Experience";

export const SITE_KEYWORDS = [
	"contactless ordering",
	"restaurant ordering system",
	"QR code menu",
	"digital menu",
	"online food ordering",
	"AI restaurant assistant",
	"smart dining",
	"contactless dining",
	"restaurant management",
	"kitchen dashboard",
	"order management system",
	"food ordering platform",
	"QR code ordering",
	"restaurant technology",
	"SmartCanteen AI",
] as const;

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;
