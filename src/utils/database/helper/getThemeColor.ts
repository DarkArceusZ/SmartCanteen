import { getServerSession } from "next-auth";

import { DEFAULT_THEME_COLOR } from "#utils/constants/common";
import { authOptions } from "#utils/helper/authHelper";
import connectDB from "../connect";
import { Profiles, type TProfile } from "../models/profile";

export const getThemeColor = async (username?: string) => {
	try {
		if (!username) {
			const session = await getServerSession(authOptions);
			return session?.themeColor || DEFAULT_THEME_COLOR;
		}

		await connectDB();
		const themeColor = (await Profiles.findOne<TProfile>({ restaurantID: username }))?.themeColor;
		return themeColor || DEFAULT_THEME_COLOR;
	} catch (err) {
		console.warn("Theme color fallback to default:", err);
		return DEFAULT_THEME_COLOR;
	}
};
