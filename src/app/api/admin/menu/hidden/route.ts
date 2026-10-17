import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Menus, type TMenu } from "#utils/database/models/menu";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function POST(req: Request) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		const { itemId, hidden } = await req.json();

		if (!session || session.role !== "admin" || !session.username) {
			throw { status: 401, message: "Admin authorization required" };
		}
		if (!itemId) throw { status: 400, message: "Menu item id is required" };
		if (hidden === undefined) throw { status: 400, message: "Hidden value required" };

		const menuItem = await Menus.findById<TMenu>(itemId);

		if (!menuItem) throw { status: 404, message: `Menu item with id: ${itemId}, not found` };
		if (menuItem.restaurantID !== session.username.toLowerCase()) {
			throw { status: 403, message: "Unauthorized: item belongs to another restaurant" };
		}

		menuItem.hidden = hidden;

		await menuItem.save();

		return NextResponse.json({ status: 200, message: hidden ? "Menu item is now hidden" : "Menu item is now visible to customers" });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
