import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { Kitchens } from "#utils/database/models/kitchen";
import { Menus } from "#utils/database/models/menu";
import { Profiles } from "#utils/database/models/profile";
import { Tables } from "#utils/database/models/table";
import { CatchNextResponse } from "#utils/helper/common";

import empire from "./_data/empire/empire";
import starbucks from "./_data/starbucks/starbucks";

const deleteData = async (ids: string[]) => {
	const start = performance.now();
	const models = [
		{ model: Menus, name: "Menus" },
		{ model: Kitchens, name: "Kitchens" },
		{ model: Profiles, name: "Profiles" },
		{ model: Tables, name: "Tables" },
		{ model: Accounts, name: "Accounts", field: "username" },
	];

	const results = await Promise.all(
		models.map(async ({ model, name, field = "restaurantID" }) => {
			const res = await model.deleteMany({ [field]: { $in: ids } });
			return { model: name, ...res };
		}),
	);

	return {
		processTime: (performance.now() - start) / 1000,
		results,
	};
};

const createData = async (props: TDocumentData) => {
	const { account, profile, menus, kitchens, tables } = props;
	const start = performance.now();

	const newAccount = await new Accounts(account).save();
	const newProfile = await new Profiles(profile).save();

	const [newKitchens, newTables] = await Promise.all([
		Promise.all(kitchens.map((k) => new Kitchens(k).save())),
		Promise.all(tables.map((t) => new Tables(t).save())),
	]);

	const newMenus = await Promise.all(menus.map((m) => new Menus(m).save()));

	await Accounts.updateOne(
		{ _id: newAccount._id },
		{
			$set: {
				profile: newProfile._id,
				kitchens: newKitchens.map((k) => k._id),
				tables: newTables.map((t) => t._id),
				menus: newMenus.map((m) => m._id),
			},
		},
	);

	return {
		processTime: (performance.now() - start) / 1000,
		account: newAccount,
		profile: newProfile,
		menus: newMenus,
		kitchens: newKitchens,
		tables: newTables,
	};
};

export async function GET() {
	if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEMO_SEEDING !== "true") {
		return new Response(JSON.stringify({ status: 403, message: "Demo data seeding is disabled in production. Set ENABLE_DEMO_SEEDING=true to override." }), {
			status: 403,
			headers: { "Content-Type": "application/json" },
		});
	}

	if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEMO_SEEDING !== "true") {
		return new Response(JSON.stringify({ status: 403, message: "Demo data seeding is disabled in production. Set ENABLE_DEMO_SEEDING=true to override." }), {
			status: 403,
			headers: { "Content-Type": "application/json" },
		});
	}

	await connectDB();
	try {
		const start = performance.now();
		const deleteResult = await deleteData(["empire", "starbucks"]);
		const empireResult = await createData(empire);
		const starbucksResult = await createData(starbucks);

		const res = {
			totalProcessTime: (performance.now() - start) / 1000,
			delete: deleteResult,
			empire: empireResult,
			starbucks: starbucksResult,
		};
		return new Response(JSON.stringify(res, null, 4));
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

type TDocumentData = {
	account: unknown;
	profile: unknown;
	menus: Array<unknown>;
	kitchens: Array<unknown>;
	tables: Array<unknown>;
};
