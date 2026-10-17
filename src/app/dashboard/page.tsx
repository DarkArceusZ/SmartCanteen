import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { capitalize } from "xtreme-ui";

import { DashboardProvider } from "#components/context";
import NavSideBar from "#components/layout/NavSideBar";
import { authOptions } from "#utils/helper/authHelper";

import PageContainer from "./_components/PageContainer";
import "./dashboard.scss";

const navItems = [
	{ label: "home", icon: "f015", value: "home" },
	{ label: "orders", icon: "e43b", value: "orders" },
	{ label: "analytics", icon: "e1bc", value: "analytics" },
	{ label: "kitchen", icon: "f2e7", value: "kitchen" },
	{ label: "settings", icon: "f013", value: "settings" },
	{ label: "sign out", icon: "f011", value: "signout" },
];

export async function generateMetadata({ searchParams }: IMetaDataProps) {
	const s = await searchParams;
	return {
		title: `SmartCanteen AI${s.tab ? ` • ${capitalize(s.tab)}` : ""}`,
	};
}

const Dashboard = async () => {
	const session = await getServerSession(authOptions);
	if (session?.role === "kitchen") redirect("/kitchen");
	if (session?.role !== "admin") redirect("/");

	return (
		<DashboardProvider>
			<div className="dashboard">
				<NavSideBar navItems={navItems} defaultTab="orders" foot />
				<PageContainer />
			</div>
		</DashboardProvider>
	);
};

export default Dashboard;

interface IMetaDataProps {
	params: {
		restaurant: string;
	};
	searchParams: {
		tab?: string;
		[key: string]: string | undefined;
	};
}
