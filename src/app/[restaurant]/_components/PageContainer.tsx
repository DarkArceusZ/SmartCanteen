"use client";

import { useSearchParams } from "next/navigation";

import ContactPage from "./Contact/ContactPage";
import ExplorePage from "./Explore/ExplorePage";
import OrderPage from "./Menu/OrderPage";
import ReviewsPage from "./Reviews/ReviewsPage";

export default function PageContainer() {
	const searchParams = useSearchParams();
	const activeTab = searchParams.get("tab") || "menu";

	return (
		<div className="pageContainer">
			{activeTab === "menu" && <OrderPage />}
			{activeTab === "explore" && <ExplorePage />}
			{activeTab === "reviews" && <ReviewsPage />}
			{activeTab === "contact" && <ContactPage />}
		</div>
	);
}
