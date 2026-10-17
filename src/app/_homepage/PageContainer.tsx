"use client";

import { useState } from "react";

import AboutSection from "./AboutSection";
import FeatureSection from "./FeatureSection";
import FooterSection from "./FooterSection";
import LandingSection from "./LandingSection";
import LoginSection from "./LoginSection";
import Navbar from "./Navbar";

export default function PageContainer() {
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<div className="homepage">
			<Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
			<main className={`homepageSections ${menuOpen ? "menuOpen" : ""}`}>
				<LandingSection />
				<AboutSection />
				<FeatureSection />
				<LoginSection />
				<FooterSection />
			</main>
		</div>
	);
}
