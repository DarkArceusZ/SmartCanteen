import clsx from "clsx";
import Link from "next/link";
import { useEffect } from "react";

import { useAdmin } from "#components/context/useContext";
import { useQueryParams } from "#utils/hooks/useQueryParams";

import "./navTopBar.scss";

const subNavItems = {
	home: [
		{ label: "overview", route: "overview" },
		{ label: "bills", route: "bills" },
	],
	orders: [
		{ label: "requests", route: "requests" },
		{ label: "active", route: "active" },
		{ label: "history", route: "history" },
	],
	settings: [
		{ label: "account", route: "account" },
		{ label: "menu", route: "menu" },
	],
} as Record<string, Array<{ label: string; route: string }>>;

const NavTopBar = (props: TNavTopBarProps) => {
	const { title, menuOpen, onClick } = props;

	const queryParams = useQueryParams();
	const tab = queryParams.get("tab") || "orders";
	const subTab = queryParams.get("subTab") || (tab === "orders" ? "active" : "");

	const { orderRequest = [], orderActive = [], orderHistory = [] } = useAdmin();

	const currentNav = subNavItems[tab] || subNavItems.orders;

	useEffect(() => {
		if (currentNav && !currentNav.some((item) => item.route === subTab)) {
			queryParams.set({ subTab: currentNav[0]?.route });
		}
	}, [currentNav, queryParams, subTab]);

	return (
		<div className="navTopBar" id="navBar">
			{title && (
				<Link className="logo" href="/">
					{title}
				</Link>
			)}
			<div className={`menu ${menuOpen ? "open" : ""}`}>
				<div className="icon ripple round" onClick={onClick}>
					<span className="line1" />
					<span className="line2" />
				</div>
				<div className="navBarContainer">
					{currentNav?.map((item, i) => {
						const count =
							tab === "orders"
								? item.route === "requests"
									? orderRequest?.length
									: item.route === "active"
										? orderActive?.length
										: orderHistory?.length
								: undefined;
						return (
							<div key={i} className={clsx("item", subTab === item?.route && "active")} onClick={() => queryParams.set({ subTab: item?.route })}>
								<span />
								<p>
									{item.label}
									{count !== undefined && count > 0 && <span className="tabBadge">{count}</span>}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default NavTopBar;

export type TNavTopBarProps = {
	title?: string;
	menuOpen?: boolean;
	onClick?: () => void;
};
