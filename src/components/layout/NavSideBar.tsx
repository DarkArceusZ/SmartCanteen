"use client";

import clsx from "clsx";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import { Icon } from "xtreme-ui";

import { useQueryParams } from "#utils/hooks/useQueryParams";

import "./navSideBar.scss";

const NavSideBar = (props: TNavSideBar) => {
	const { head, foot, navItems, defaultTab } = props;
	const router = useRouter();
	const pathname = usePathname();
	const session = useSession();
	const queryParams = useQueryParams();
	const tab = queryParams.get("tab") ?? "";

	const classList = clsx("menu", head && "head", foot && "foot");

	const onNavClick = (tab: string) => {
		if (tab === "home") {
			if (pathname && pathname !== "/" && !pathname.startsWith("/dashboard") && !pathname.startsWith("/kitchen")) {
				queryParams.set({ tab: "menu" });
				return;
			}
			return router.push("/");
		}
		if (tab === "kitchen") return router.push("/kitchen");
		if (tab === "signout") {
			const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
			return signOut({ callbackUrl: currentUrl });
		}
		queryParams.set({ tab });
	};

	useEffect(() => {
		if (!tab) queryParams.set({ tab: defaultTab });
	}, [defaultTab, queryParams, tab]);

	return (
		<div className="navSideBar">
			<div className="navTopAction">
				<button
					type="button"
					className="navBackCircleBtn"
					aria-label="Back"
					title="Back"
					onClick={() => {
						if (typeof window !== "undefined" && window.history.length > 1) {
							router.back();
						} else {
							queryParams.set({ tab: defaultTab || "menu" });
						}
					}}>
					<Icon code="f053" size={12} type="solid" />
				</button>
			</div>
			<div className={classList}>
				{navItems.map((item, key) => {
					if (item.value === "signout" && session.status !== "authenticated") return null;

					const active = tab === item.value;
					return (
						<div key={key} className={clsx("navItem", active && "active")} onClick={() => onNavClick(item.value)}>
							<div className="navItemContent">
								<Icon code={item.icon} size={20} set={active ? "classic" : "duotone"} type="solid" />
								<p>{item.label}</p>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default NavSideBar;

type TNavSideBar = {
	navItems: Array<{ label: string; value: string; icon: string }>;
	defaultTab: string;
	head?: boolean;
	foot?: boolean;
};
