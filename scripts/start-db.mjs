import fs from "node:fs";
import path from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";

const dbPath = path.resolve(process.cwd(), ".db-data");
if (!fs.existsSync(dbPath)) {
	fs.mkdirSync(dbPath, { recursive: true });
}

console.log("Starting embedded MongoDB instance on port 27017...");

try {
	const mongod = await MongoMemoryServer.create({
		instance: {
			port: 27017,
			dbPath,
			storageEngine: "wiredTiger",
			dbName: "smartcanteen",
		},
	});

	const uri = mongod.getUri();
	console.log(`🌿 MongoDB is running successfully!`);
	console.log(`URI: ${uri}smartcanteen`);
	console.log(`Data directory: ${dbPath}`);

	const shutdown = async () => {
		console.log("\nShutting down MongoDB...");
		await mongod.stop();
		process.exit(0);
	};

	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
} catch (err) {
	console.error("Failed to start MongoDB:", err);
	process.exit(1);
}
