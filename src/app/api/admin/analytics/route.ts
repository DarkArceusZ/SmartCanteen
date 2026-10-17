import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Menus } from "#utils/database/models/menu";
import { Orders } from "#utils/database/models/order";
import { Tables } from "#utils/database/models/table";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function GET() {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);

		if (!session || session.role !== "admin") {
			throw { status: 401, message: "Admin Authentication Required" };
		}

		const restaurantID = session.username;

		// 1. Fetch orders
		const orders = await Orders.find({ restaurantID }).lean();

		let totalRevenue = 0;
		let activeOrdersCount = 0;
		let completedOrdersCount = 0;
		const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};

		for (const order of orders) {
			if (order.state === "active") activeOrdersCount++;
			if (order.state === "complete" || order.state === "active") {
				totalRevenue += order.orderTotal || 0;
				if (order.state === "complete") completedOrdersCount++;
			}

			// Popular items counter
			for (const prod of order.products || []) {
				const id = prod.product ? prod.product.toString() : prod._id?.toString();
				const name = prod.name || "Item";
				const qty = prod.quantity || 1;
				const price = prod.price || 0;

				if (!itemCounts[id]) {
					itemCounts[id] = { name, count: 0, revenue: 0 };
				}
				itemCounts[id].count += qty;
				itemCounts[id].revenue += price * qty;
			}
		}

		const popularItems = Object.values(itemCounts)
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);

		// 2. Fetch menus count & sold-out items
		const menuItems = await Menus.find({ restaurantID }).lean();
		const totalMenuItems = menuItems.length;
		const soldOutCount = menuItems.filter((m) => m.availability === "sold-out").length;
		const specialsCount = menuItems.filter((m) => m.availability === "todays-special").length;

		// 3. Fetch tables count & reviews
		const tablesCount = await Tables.countDocuments({ restaurantID });

		const { Feedbacks } = await import("#utils/database/models/feedback");
		const feedbacks = await Feedbacks.find({ restaurantID }).lean();
		const totalReviews = feedbacks.length;
		const averageRating =
			totalReviews > 0 ? Number((feedbacks.reduce((sum: number, f: { rating?: number }) => sum + (f.rating || 5), 0) / totalReviews).toFixed(1)) : 5.0;

		const avgOrderValue = orders.length > 0 ? Number((totalRevenue / orders.length).toFixed(2)) : 0;

		// 4. Generate AI Sales & Inventory Insights (Friend 3 Requirement)
		const topItem = popularItems[0]?.name || "items";
		const fallbackInsights = [
			totalRevenue > 0
				? `💰 Revenue is strong at ₹${totalRevenue.toLocaleString()} with average ticket size of ₹${avgOrderValue}.`
				: "📈 Ready to record orders. Highlight chef specials to boost initial campus sales.",
			popularItems.length > 0
				? `🔥 Top performer: ${topItem} is leading customer demand with ${popularItems[0]?.count} orders.`
				: "📊 Sales trends will automatically populate once orders start rolling in.",
			soldOutCount > 0
				? `⚠️ Restocking needed: ${soldOutCount} item(s) marked as Sold Out. Restock inventory to prevent lost sales.`
				: "✅ All inventory items are currently in stock and available for ordering.",
			activeOrdersCount > 0
				? `🍳 Kitchen load: ${activeOrdersCount} order(s) actively being prepared. Maintain quick turnaround for high satisfaction.`
				: "⚡ Kitchen queue is clear. Perfect window for prep work before the next meal rush.",
		];

		const analyticsData = {
			totalOrders: orders.length,
			completedOrders: completedOrdersCount,
			activeOrders: activeOrdersCount,
			totalRevenue: Number(totalRevenue.toFixed(2)),
			averageOrderValue: avgOrderValue,
			totalMenuItems,
			soldOutCount,
			specialsCount,
			tablesCount,
			averageRating,
			totalReviews,
			popularItems,
			insights: fallbackInsights,
			generatedAt: new Date().toISOString(),
		};

		return NextResponse.json(analyticsData);
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
