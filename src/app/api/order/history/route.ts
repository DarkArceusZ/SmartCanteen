import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import type { TCustomer } from "#utils/database/models/customer";
import type { TMenu } from "#utils/database/models/menu";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function GET() {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);

		if (!session || !session?.customer?._id) return NextResponse.json([]);

		const restaurantID = session?.restaurant?.username;
		const customer = session?.customer?._id;

		const orders = await Orders.find({ restaurantID, customer })
			.sort({ createdAt: -1 })
			.limit(10)
			.populate<{ customer: TCustomer }>("customer")
			.populate<{ products: { product: TMenu }[] }>("products.product")
			.lean();

		return NextResponse.json(orders);
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
