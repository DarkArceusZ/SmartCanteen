import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Menus, type TMenu } from "#utils/database/models/menu";
import { Orders, type TOrder, type TProduct } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "customer" || !session.customer?._id || !session.restaurant?.username) {
			throw { status: 401, message: "Customer authentication and table session required" };
		}

		const body = await req.json();
		if (!body?.products || !Array.isArray(body.products) || body.products.length === 0) {
			throw { status: 400, message: "Can't place order on empty cart" };
		}

		await connectDB();
		const restaurantID = session.restaurant.username.toLowerCase();

		const validatedProducts: TProduct[] = await Promise.all(
			body.products.map(async (item: { _id?: string; quantity?: number }) => {
				if (!item?._id) throw { status: 400, message: "Menu item ID is required for each cart item" };

				const quantity = Math.floor(Number(item.quantity));
				if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 50) {
					throw { status: 400, message: "Quantity must be a valid integer between 1 and 50" };
				}

				const menuItem = await Menus.findById<TMenu>(item._id).lean();
				if (!menuItem) throw { status: 404, message: "One or more ordered items were not found in the canteen catalog" };

				if (menuItem.restaurantID !== restaurantID) {
					throw { status: 400, message: `"${menuItem.name}" does not belong to this canteen` };
				}

				if (menuItem.availability === "sold-out") {
					throw { status: 400, message: `"${menuItem.name}" is sold out` };
				}

				if (menuItem.hidden) {
					throw { status: 400, message: `"${menuItem.name}" is currently unavailable` };
				}

				const tax = Number(((menuItem.price * (menuItem.taxPercent || 0)) / 100).toFixed(2));

				return {
					product: menuItem._id,
					quantity,
					price: menuItem.price,
					tax,
				} as unknown as TProduct;
			}),
		);

		const table = (session.restaurant.table || "1").toLowerCase();
		const customer = session.customer._id;
		const paymentMethod = body?.paymentMethod === "upi" ? "upi" : "cash";

		const existingOrder = await Orders.findOne<TOrder>({ restaurantID, table, customer, state: "active" });

		if (existingOrder) {
			existingOrder.products = [...existingOrder.products, ...validatedProducts];
			existingOrder.paymentMethod = paymentMethod;
			// If it was already completed/ready, additional items restart kitchen alert
			if (existingOrder.kitchenStatus === "ready") {
				existingOrder.kitchenStatus = "new";
			}
			await existingOrder.save();

			return NextResponse.json({ status: 200, message: "Additional items ordered successfully", orderID: existingOrder._id });
		}

		const newOrder = new Orders({
			restaurantID,
			table,
			customer,
			products: validatedProducts,
			paymentMethod,
			state: "active",
			kitchenStatus: "new",
		});
		await newOrder.save();

		return NextResponse.json({ status: 200, message: "Order placed successfully", orderID: newOrder._id });
	} catch (err) {
		console.error("Order placement API error:", err);
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
