import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { Menus, type TMenu } from "#utils/database/models/menu";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function POST(req: Request) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin" || !session.username) {
			throw { status: 401, message: "Admin authorization required" };
		}

		const body = await req.json();
		const { _id, name, category, price, veg, availability, description, image, hidden, foodType } = body;

		if (!name || !name.trim()) throw { status: 400, message: "Dish name is required" };
		if (!category || !category.trim()) throw { status: 400, message: "Category is required" };
		if (price === undefined || Number.isNaN(Number(price)) || Number(price) < 0) {
			throw { status: 400, message: "Valid price is required" };
		}
		if (!veg || !["veg", "non-veg", "contains-egg"].includes(veg)) {
			throw { status: 400, message: "Valid dietary tag (veg/non-veg/contains-egg) is required" };
		}

		const restaurantID = session.username.toLowerCase();

		// Editing existing item
		if (_id) {
			const item = await Menus.findById<TMenu>(_id);
			if (!item) throw { status: 404, message: "Menu item not found" };
			if (item.restaurantID !== restaurantID) throw { status: 403, message: "Unauthorized for this restaurant" };

			item.name = name.trim();
			item.category = category.toLowerCase().trim();
			item.price = Number(price);
			item.veg = veg;
			if (availability) item.availability = availability;
			if (description !== undefined) item.description = description.trim();
			if (image !== undefined) item.image = image.trim();
			if (hidden !== undefined) item.hidden = Boolean(hidden);
			if (foodType) item.foodType = foodType;

			await item.save();
			return NextResponse.json({ status: 200, message: `Updated "${item.name}"`, data: item });
		}

		// Creating new item
		const existing = await Menus.findOne({
			restaurantID,
			name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
		});
		if (existing) {
			throw { status: 400, message: `An item named "${name.trim()}" already exists` };
		}

		const newItem = new Menus({
			name: name.trim(),
			restaurantID,
			category: category.toLowerCase().trim(),
			price: Number(price),
			taxPercent: 5,
			veg,
			availability: availability || "available",
			description: description ? description.trim() : "",
			image: image ? image.trim() : "",
			hidden: Boolean(hidden),
			foodType: foodType || undefined,
		});

		await newItem.save();
		return NextResponse.json({ status: 201, message: `Added "${newItem.name}" to menu`, data: newItem });
	} catch (err) {
		console.error("Admin Menu API error:", err);
		return CatchNextResponse(err);
	}
}

export async function DELETE(req: Request) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin" || !session.username) {
			throw { status: 401, message: "Admin authorization required" };
		}

		const { itemId } = await req.json();
		if (!itemId) throw { status: 400, message: "Item ID is required for deletion" };

		const restaurantID = session.username.toLowerCase();
		const item = await Menus.findById(itemId);
		if (!item) throw { status: 404, message: "Menu item not found" };
		if (item.restaurantID !== restaurantID) throw { status: 403, message: "Unauthorized" };

		await Menus.findByIdAndDelete(itemId);
		await Accounts.updateOne({ username: restaurantID }, { $pull: { menus: itemId } });

		return NextResponse.json({ status: 200, message: `Deleted "${item.name}"` });
	} catch (err) {
		console.error("Admin Menu Delete API error:", err);
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
