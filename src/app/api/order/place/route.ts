import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Customers } from "#utils/database/models/customer";
import { Menus, type TMenu } from "#utils/database/models/menu";
import { Orders, type TOrder, type TProduct } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function POST(req: Request) {
	try {
		await connectDB();
		const body = await req.json();
		const session = await getServerSession(authOptions);

		let customer = session?.customer?._id;
		let restaurantID = session?.restaurant?.username?.toLowerCase() || body?.restaurantID?.toLowerCase();
		const table = (body?.table || session?.restaurant?.table || "1").toLowerCase();

		// If customer is not authenticated via session, allow name & phone from request body
		if (!customer && (body?.phone || body?.fname || body?.name)) {
			const cleanPhone = (body.phone || "").trim();
			const cleanName = (body.fname || body.name || "Customer").trim();

			if (!cleanPhone) throw { status: 400, message: "Phone number is required to place an order" };

			let customerDoc = await Customers.findOne({ phone: cleanPhone });
			if (!customerDoc) {
				customerDoc = await new Customers({ fname: cleanName, lname: "", phone: cleanPhone }).save();
			} else if (cleanName && customerDoc.fname !== cleanName) {
				customerDoc.fname = cleanName;
				await customerDoc.save();
			}
			customer = customerDoc._id;
		}

		if (!customer) {
			throw { status: 401, message: "Please enter your name and phone number to place your order" };
		}

		if (!body?.products || !Array.isArray(body.products) || body.products.length === 0) {
			throw { status: 400, message: "Can't place order on empty cart" };
		}

		// Fallback restaurantID from the first menu item if missing
		if (!restaurantID && body.products[0]?._id) {
			const firstItem = await Menus.findById<TMenu>(body.products[0]._id).lean();
			if (firstItem?.restaurantID) restaurantID = firstItem.restaurantID.toLowerCase();
		}
		if (!restaurantID) {
			throw { status: 400, message: "Canteen identifier is required" };
		}

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
