import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { DashboardProvider } from "#components/context";
import { authOptions } from "#utils/helper/authHelper";

import KitchenBoard from "./_components/KitchenBoard";
import "./kitchen.scss";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "SmartCanteen AI • Kitchen Order Display",
};

const Kitchen = async () => {
	const session = await getServerSession(authOptions);
	if (session?.role !== "admin" && session?.role !== "kitchen") redirect("/");

	return (
		<DashboardProvider>
			<KitchenBoard />
		</DashboardProvider>
	);
};

export default Kitchen;
