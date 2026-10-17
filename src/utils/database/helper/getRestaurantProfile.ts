import connectDB from "#utils/database/connect";
import { Profiles, type TProfile } from "#utils/database/models/profile";

const SEO_FIELDS = "name restaurantID description address avatar cover categories themeColor" as const;

export async function getRestaurantProfile(restaurantID: string) {
	try {
		await connectDB();
		return await Profiles.findOne<TProfile>({ restaurantID }).select(SEO_FIELDS).lean();
	} catch (err) {
		console.warn(`Failed to fetch profile for ${restaurantID}:`, err);
		return null;
	}
}
