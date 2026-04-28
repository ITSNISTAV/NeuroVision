const mongoose = require("mongoose");

const connectDB = async () => {
	const mongoUri = process.env.MONGODB_URI;

	if (!mongoUri) {
		console.warn("[MongoDB] MONGODB_URI not found. Running without MongoDB connection.");
		return false;
	}

	try {
		await mongoose.connect(mongoUri, {
			serverSelectionTimeoutMS: 8000,
			maxPoolSize: 10
		});
		console.log("[MongoDB] Connected successfully.");
		return true;
	} catch (error) {
		console.error("[MongoDB] Connection failed:", error.message);
		return false;
	}
};

module.exports = { connectDB };
