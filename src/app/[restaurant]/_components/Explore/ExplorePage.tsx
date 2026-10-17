import { useRouter } from "next/navigation";
import { Icon } from "xtreme-ui";

import { useRestaurant } from "#components/context/useContext";

import "./explorePage.scss";

const highlights = [
	{ icon: "f2e7", title: "Find something delicious", text: "Explore familiar favourites and discover something new for your next break." },
	{ icon: "e1bc", title: "Order from your table", text: "Choose your items, ask Jarvis for help, and place your order in a few taps." },
	{ icon: "f017", title: "Keep your break simple", text: "Spend less time waiting and more time enjoying good food with friends." },
];

const ExplorePage = () => {
	const router = useRouter();
	const { restaurant, loading } = useRestaurant();
	const profile = restaurant?.profile;
	const restaurantName = profile?.name ?? "SmartCanteen AI";
	const address = profile?.address ?? "College campus canteen";
	const categories = profile?.categories ?? [];
	const photos = profile?.photos?.filter(Boolean) ?? [];
	const cover = profile?.cover || photos[0];
	const openMenu = () => {
		const params = new URLSearchParams(window.location.search);
		params.set("tab", "menu");
		router.replace(`${window.location.pathname}?${params.toString()}`);
	};

	if (loading || !restaurant) {
		return <div className="explorePage explorePageLoading">Loading canteen details...</div>;
	}

	return (
		<div className="explorePage">
			<section className="exploreHero" style={cover ? { backgroundImage: `url(${cover})` } : undefined}>
				<div className="heroOverlay" />
				<div className="heroContent">
					<p className="eyebrow">Your campus, your cravings</p>
					<h1>
						{restaurantName.split(" ").slice(0, -1).join(" ")} <span>{restaurantName.split(" ").slice(-1)}</span>
					</h1>
					<p className="heroDescription">Take a quick break with fresh favourites, easy ordering, and a menu made for your campus day.</p>
					<div className="heroMeta">
						<span>
							<Icon code="f3c5" type="solid" /> {address}
						</span>
						<span>
							<Icon code="f017" type="solid" /> Open daily
						</span>
					</div>
					<button type="button" className="menuCta" onClick={openMenu}>
						Browse menu <span>↗</span>
					</button>
				</div>
			</section>

			<section className="exploreSection categorySection">
				<div className="sectionHeading">
					<p className="eyebrow">Something for every mood</p>
					<h2>
						Explore the <span>menu</span>
					</h2>
				</div>
				<div className="categoryChips">
					{categories.length > 0 ? categories.map((category) => <span key={category}>{category}</span>) : <span>Fresh canteen favourites</span>}
				</div>
			</section>

			<section className="exploreSection highlightSection">
				<div className="sectionHeading">
					<p className="eyebrow">A better way to order</p>
					<h2>
						Enjoy your break, <span>your way</span>
					</h2>
				</div>
				<div className="highlightGrid">
					{highlights.map((highlight) => (
						<div className="highlightCard" key={highlight.title}>
							<div className="highlightIcon">
								<Icon code={highlight.icon} type="solid" />
							</div>
							<h3>{highlight.title}</h3>
							<p>{highlight.text}</p>
						</div>
					))}
				</div>
			</section>

			{photos.length > 0 && (
				<section className="exploreSection photoSection">
					<div className="sectionHeading">
						<p className="eyebrow">Take a look around</p>
						<h2>
							Your canteen, <span>your space</span>
						</h2>
					</div>
					<div className="photoGrid">
						{photos.slice(0, 4).map((photo, index) => (
							<div className={`photo photo${index + 1}`} key={photo} style={{ backgroundImage: `url(${photo})` }} />
						))}
					</div>
				</section>
			)}
		</div>
	);
};

export default ExplorePage;
