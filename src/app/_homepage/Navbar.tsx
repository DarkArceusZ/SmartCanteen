"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ThemeSelect } from "xtreme-ui";
import { scrollToSection } from "#utils/helper/common";
import "./navbar.scss";

export default function Navbar({ menuOpen, setMenuOpen }: TNavBarProps) {
	const router = useRouter();
	const { data: session } = useSession();
	const role = session?.role;

	const navItems = [
		{ label: "About Us", action: () => scrollToSection("homepage-aboutus") },
		{ label: "Features", action: () => scrollToSection("homepage-features") },
		{ label: "Scan QR", action: () => router.push("/scan") },
		...(role === "admin"
			? [{ label: "Dashboard", action: () => router.push("/dashboard") }]
			: role === "kitchen"
				? [{ label: "Kitchen", action: () => router.push("/kitchen") }]
				: [{ label: "Login", action: () => scrollToSection("homepage-login") }]),
	];

	return (
		<div className="homeNavbar" id="homepage-navBar">
			<div className="logo" onClick={() => scrollToSection("homepage")}>
				SmartCanteen AI
			</div>
			<div className={`menu ${menuOpen ? "open" : ""}`}>
				<div className="icon round" onClick={() => setMenuOpen(!menuOpen)}>
					<span className="line1" />
					<span className="line2" />
				</div>
				<div className="container">
					{navItems.map((item, key) => {
						return (
							<div
								key={key}
								className="item"
								onClick={() => {
									item.action();
									setMenuOpen(false);
								}}>
								<p>{item.label}</p>
							</div>
						);
					})}
				</div>
				<ThemeSelect size="mini" withSwatch withScheme />
			</div>
		</div>
	);
}

type TNavBarProps = {
	menuOpen: boolean;
	setMenuOpen: (menuOpen: boolean) => void;
};
