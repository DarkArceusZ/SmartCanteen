import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Accounts, type TAccount } from "#utils/database/models/account";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { verifyPassword } from "#utils/helper/passwordHelper";

export async function POST(req: Request) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		const { password, newPassword } = await req.json();

		if (!session || session.role !== "admin" || !session.username) {
			throw { status: 401, message: "Admin authorization required" };
		}
		if (!password) throw { status: 400, message: "Current password is required" };
		if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
			throw { status: 400, message: "New password must be at least 6 characters" };
		}

		const account = await Accounts.findOne<TAccount>({ username: session?.username });

		if (!account) throw { status: 500, message: "Something went wrong" };

		const valid = await verifyPassword(password, account.password);

		if (valid) {
			account.password = newPassword;
			await account.save();
			return NextResponse.json({ status: 200, message: "Password successfully changed" });
		}

		return NextResponse.json({ status: 403, message: "Password incorrect" });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
