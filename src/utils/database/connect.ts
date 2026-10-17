import { connect } from "mongoose";
import "./models/profile";
import "./models/account";
import "./models/customer";
import "./models/kitchen";
import "./models/menu";
import "./models/table";
import "./models/order";
import "./models/aiConfig";
import "./models/feedback";

const options = {
	autoIndex: false,
	maxPoolSize: 10,
	serverSelectionTimeoutMS: 5000,
	socketTimeoutMS: 45000,
};

let cached = global.mongoose;

if (!cached) {
	cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
	if (cached.conn) return cached.conn;

	if (!process.env.MONGODB_URI) {
		throw new Error("Please add your MongoDB connection string to Environment Variables (MONGODB_URI).");
	}

	if (!cached.promise) {
		console.log("🌿 Connecting to MongoDB Server...");
		cached.promise = connect(process.env.MONGODB_URI, options)
			.then((mongoose) => {
				console.log("🍃 MongoDB Connection Established");
				return mongoose;
			})
			.catch((error) => {
				console.error("🍂 MongoDB Connection Failed: ", error);
				cached.promise = null;
				throw error;
			});
	}

	try {
		cached.conn = await cached.promise;
	} catch (e) {
		cached.promise = null;
		throw e;
	}

	return cached.conn;
}

export default connectDB;
