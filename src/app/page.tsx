import { themeController } from "xtreme-ui";

import { DashboardProvider } from "#components/context";
import JsonLd from "#components/seo/JsonLd";
import { DEFAULT_THEME_COLOR } from "#utils/constants/common";
import { getThemeColor } from "#utils/database/helper/getThemeColor";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "#utils/seo/constants";
import { buildMetadata } from "#utils/seo/metadata";
import PageContainer from "./_homepage/PageContainer";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
	title: "Contactless Restaurant Ordering & AI-Powered Dining",
	description: SITE_DESCRIPTION,
	path: "/",
});

export default async function Homepage() {
	let color = DEFAULT_THEME_COLOR;
	try {
		color = (await getThemeColor()) ?? DEFAULT_THEME_COLOR;
	} catch (err) {
		console.warn("Theme color fallback on Homepage:", err);
	}
	return (
		<DashboardProvider>
			<script dangerouslySetInnerHTML={{ __html: themeController({ color }) }} suppressHydrationWarning />
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "WebApplication",
					name: SITE_NAME,
					url: SITE_URL,
					description: SITE_DESCRIPTION,
					applicationCategory: "BusinessApplication",
					operatingSystem: "Web",
					offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
					publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
				}}
			/>
			<PageContainer />
		</DashboardProvider>
	);
}
