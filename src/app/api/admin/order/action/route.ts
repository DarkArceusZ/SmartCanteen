import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Orders, type TOrder } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

const actions = ["accept", "reject", "rejectOnActive", "complete", "startPreparing", "markReady"];
export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		const body = await req.json();

		if (!session || (session.role !== "admin" && session.role !== "kitchen") || !session.username) {
			throw { status: 401, message: "Admin or Kitchen authorization required" };
		}
		if (!body?.orderID) throw { status: 400, message: "Order id is required to perform an action" };
		if (!actions.includes(body?.action)) throw { status: 400, message: "Invalid action provided" };

		await connectDB();

		const order = await Orders.findById<TOrder>(body?.orderID);

		if (!order) throw { status: 404, message: `Order with id: ${body?.orderID} not found` };
		if (order.restaurantID !== session.username.toLowerCase()) {
			throw { status: 403, message: "Unauthorized: this order belongs to another restaurant" };
		}

		if (body.action === "accept") {
			order.products.forEach((product) => {
				product.adminApproved = true;
			});
			order.kitchenStatus = "new";
		}

		if (body.action === "startPreparing") {
			order.kitchenStatus = "preparing";
		}

		if (body.action === "markReady") {
			order.kitchenStatus = "ready";
		}

		if (body.action === "reject") {
			if (!order.products.some(({ adminApproved }) => adminApproved)) order.state = "reject";
			else order.products = order.products.filter(({ adminApproved }) => adminApproved);
			if (body.rejectReason) order.rejectReason = body.rejectReason;
		}

		if (body.action === "rejectOnActive") {
			order.state = "reject";
			if (body.rejectReason) order.rejectReason = body.rejectReason;
		}

		if (body.action === "complete") {
			order.state = "complete";
			order.kitchenStatus = "ready";
		}

		await order.save();

		return NextResponse.json({ status: 200, message: "Order updated successfully" });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
