import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Orders, type TOrder } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function POST() {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "customer" || !session.customer?._id || !session.restaurant?.username) {
			throw { status: 401, message: "Customer authentication required" };
		}

		await connectDB();
		const restaurantID = session.restaurant.username.toLowerCase();
		const customer = session.customer._id;

		const order = await Orders.findOne<TOrder>({ restaurantID, customer, state: "active" });

		if (!order) throw { status: 400, message: "No active orders found to cancel" };

		if (order.kitchenStatus === "preparing" || order.kitchenStatus === "ready") {
			throw { status: 400, message: "Cannot cancel order: kitchen has already begun cooking your food" };
		}

		order.state = "cancel";
		await order.save();

		return NextResponse.json({ status: 200, message: "Order canceled successfully" });
	} catch (err) {
		console.error("Order cancellation API error:", err);
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
