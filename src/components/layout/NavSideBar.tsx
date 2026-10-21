"use client";

import clsx from "clsx";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
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

	const [forceCollapsed, setForceCollapsed] = useState(false);
	const [expanded, setExpanded] = useState(false);

	const classList = clsx("menu", head && "head", foot && "foot");

	const onNavClick = (tabValue: string) => {
		setForceCollapsed(true);
		setExpanded(false);

		// Handle Menu and Home clicks on customer restaurant view
		if (tabValue === "menu" || tabValue === "home") {
			if (pathname && pathname !== "/" && !pathname.startsWith("/dashboard") && !pathname.startsWith("/kitchen")) {
				queryParams.set({ tab: "menu" });
				if (typeof window !== "undefined") {
					window.dispatchEvent(new CustomEvent("smartcanteen-menu-reset"));
					const mainContainer = document.querySelector(".orderPage .mainContainer") as HTMLElement | null;
					if (mainContainer) {
						mainContainer.scrollTo({ top: 0, behavior: "smooth" });
					}
				}
				return;
			}
			return router.push("/");
		}

		if (tabValue === "kitchen") return router.push("/kitchen");
		if (tabValue === "signout") {
			const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
			return signOut({ callbackUrl: currentUrl });
		}
		queryParams.set({ tab: tabValue });
	};

	const onToggleSidebar = (e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();

		if (!forceCollapsed) {
			// Collapse sidebar immediately
			setForceCollapsed(true);
			setExpanded(false);
			// Also navigate back to menu if user was on a subtab
			if (tab && tab !== defaultTab && tab !== "menu") {
				queryParams.set({ tab: defaultTab || "menu" });
			}
		} else {
			// Expand sidebar
			setForceCollapsed(false);
			setExpanded(true);
		}
	};

	useEffect(() => {
		if (!tab) queryParams.set({ tab: defaultTab });
	}, [defaultTab, queryParams, tab]);

	return (
		<div
			className={clsx("navSideBar", forceCollapsed && "forceCollapsed", expanded && "expanded")}
			onMouseLeave={() => {
				setForceCollapsed(false);
				setExpanded(false);
			}}
		>
			<div className="navTopAction">
				<button
					type="button"
					className="navBackCircleBtn"
					aria-label={forceCollapsed ? "Expand Sidebar" : "Collapse Sidebar / Go Back"}
					title={forceCollapsed ? "Expand" : "Close / Back"}
					onClick={onToggleSidebar}
				>
					<Icon code={forceCollapsed ? "f054" : "f053"} size={13} type="solid" />
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
