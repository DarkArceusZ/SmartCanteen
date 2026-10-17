import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Feedbacks } from "#utils/database/models/feedback";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function GET(req: Request) {
	try {
		const restaurantID = new URL(req.url).searchParams.get("restaurant")?.trim().toLowerCase();
		if (!restaurantID) throw { status: 400, message: "Restaurant id is required" };

		const session = await getServerSession(authOptions);
		await connectDB();
		const reviews = await Feedbacks.find({ restaurantID }).sort({ createdAt: -1 }).limit(50).populate("customer", "fname lname").lean();
		const myReview = session?.role === "customer" && session?.customer?._id ? await Feedbacks.findOne({ restaurantID, customer: session.customer._id }).lean() : null;
		const total = reviews.length;
		const ratingTotal = reviews.reduce((sum, review) => sum + review.rating, 0);
		const breakdown = [5, 4, 3, 2, 1].map((stars) => reviews.filter((review) => review.rating === stars).length);

		return NextResponse.json({
			reviews,
			myReview,
			summary: {
				average: total ? Number((ratingTotal / total).toFixed(1)) : 0,
				total,
				breakdown,
			},
		});
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (session?.role !== "customer") throw { status: 401, message: "Only customers can submit feedback" };

		const body = await req.json();
		const restaurantID = body?.restaurant?.trim?.().toLowerCase?.();
		const rating = Number(body?.rating);
		const comment = body?.comment?.trim?.();
		const sessionRestaurant = session?.restaurant?.username?.toLowerCase?.();

		if (!restaurantID || restaurantID !== sessionRestaurant) throw { status: 403, message: "You can only review the current restaurant" };
		if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw { status: 400, message: "Rating must be between 1 and 5" };
		if (!comment || comment.length < 3) throw { status: 400, message: "Please write at least 3 characters" };
		if (comment.length > 500) throw { status: 400, message: "Feedback must be 500 characters or less" };
		if (!session?.customer?._id) throw { status: 401, message: "Customer account is required" };

		await connectDB();
		const review = await Feedbacks.findOneAndUpdate(
			{ restaurantID, customer: session.customer._id },
			{ $set: { rating, comment }, $setOnInsert: { restaurantID, customer: session.customer._id } },
			{ new: true, upsert: true, runValidators: true },
		).lean();

		return NextResponse.json({ review, message: "Feedback saved successfully" });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
