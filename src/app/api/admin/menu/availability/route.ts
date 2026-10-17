import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Menus, type TAvailability, type TMenu } from "#utils/database/models/menu";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function POST(req: Request) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		const { itemId, availability, stockCount } = await req.json();

		if (!session || (session.role !== "admin" && session.role !== "kitchen") || !session.username) {
			throw { status: 401, message: "Admin or Kitchen authorization required" };
		}
		if (!itemId) throw { status: 400, message: "Menu item id is required" };

		const validAvailabilities: TAvailability[] = ["available", "sold-out", "todays-special"];
		if (availability && !validAvailabilities.includes(availability)) {
			throw { status: 400, message: `Invalid availability. Must be one of: ${validAvailabilities.join(", ")}` };
		}

		const menuItem = await Menus.findById<TMenu>(itemId);
		if (!menuItem) throw { status: 404, message: `Menu item with id: ${itemId}, not found` };
		if (menuItem.restaurantID !== session.username.toLowerCase()) {
			throw { status: 403, message: "Unauthorized: item belongs to another restaurant" };
		}

		if (availability !== undefined) {
			menuItem.availability = availability;
		}

		if (stockCount !== undefined) {
			menuItem.stockCount = stockCount;
		}

		await menuItem.save();

		return NextResponse.json({
			status: 200,
			message: `Item availability updated to ${menuItem.availability}`,
			data: {
				_id: menuItem._id,
				availability: menuItem.availability,
				stockCount: menuItem.stockCount,
			},
		});
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
