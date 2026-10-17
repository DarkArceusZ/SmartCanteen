import mongoose from "mongoose";
import { NextResponse } from "next/server";
import connectDB from "#utils/database/connect";

export async function GET() {
	let dbStatus = "disconnected";

	try {
		await connectDB();
		dbStatus = mongoose.connection.readyState === 1 ? "connected" : "connecting";
	} catch {
		dbStatus = "unavailable";
	}

	const isHealthy = dbStatus === "connected";

	return NextResponse.json(
		{
			status: isHealthy ? "healthy" : "degraded",
			service: "smartcanteen-ai",
			timestamp: new Date().toISOString(),
			database: dbStatus,
			uptime: Math.floor(process.uptime()),
		},
		{
			status: isHealthy ? 200 : 503,
			headers: {
				"Cache-Control": "no-store, max-age=0",
			},
		},
	);
}

export const dynamic = "force-dynamic";
