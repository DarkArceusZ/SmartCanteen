import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Accounts, type TAccount } from "#utils/database/models/account";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session || (session.role !== "admin" && session.role !== "kitchen") || !session.username) {
			return NextResponse.json({ message: "Unauthorized", status: 401 }, { status: 401 });
		}

		await connectDB();
		const account = await Accounts.findOne<TAccount>({ username: session.username }).populate("profile").populate("tables").populate("menus").lean();

		if (!account) {
			return NextResponse.json({ message: "Account not found", status: 404 }, { status: 404 });
		}

		return NextResponse.json({
			profile: account.profile,
			menus: account.menus,
			tables: account.tables,
		});
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
