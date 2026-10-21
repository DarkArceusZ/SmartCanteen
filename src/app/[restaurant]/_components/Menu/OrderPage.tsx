import { signOut, useSession } from "next-auth/react";

import { type UIEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ActionCard, Button, Spinner } from "xtreme-ui";

import SearchButton from "#components/base/SearchButton";

import SideSheet from "#components/base/SideSheet";

import { useOrder, useRestaurant } from "#components/context/useContext";

import Modal from "#components/layout/Modal";

import type { TMenu } from "#utils/database/models/menu";

import { useQueryParams } from "#utils/hooks/useQueryParams";

import CartPage from "./CartPage";

import MenuCard from "./MenuCard";

import UserLogin from "./UserLogin";

import "./orderPage.scss";

const OrderPage = () => {

	const session = useSession();

	const {

		loading,

		loginOpen,

		setLoginOpen,

		order: activeOrder,

		selectedProducts,

		increaseProductQuantity,

		decreaseProductQuantity,

		resetSelectedProducts,

		sideSheetOpen,

		setSideSheetOpen,

	} = useOrder();

	const { restaurant, loading: restaurantLoading } = useRestaurant();

	const menus = useMemo(() => (restaurant?.menus as Array<TMenuCustom>) || [], [restaurant?.menus]);

	const params = useQueryParams();

	const [searchValue, setSearchValue] = useState(() => params.get("search")?.trim() ?? "");

	const [selectedCategory, setSelectedCategory] = useState<string>(() => {

		const cat = params.get("category")?.trim();

		return !cat || cat.toLowerCase() === "all" ? "all" : cat;

	});

	const order = useRef<HTMLDivElement>(null);

	const categories = useRef<HTMLDivElement>(null);

	const [topHeading, setTopHeading] = useState(["Menu", "Category"]);

	const [orderHeading, setOrderHeading] = useState(["Explore", "Menu"]);

	const sideSheetHeading = useMemo<[string, string]>(() => {
		if (selectedProducts.length > 0) return ["Your", "Cart"];
		if (activeOrder?.products?.length) return ["Digital", "Receipt"];
		return ["Your", "Order"];
	}, [selectedProducts.length, activeOrder?.products?.length]);
	const setSideSheetHeading = useCallback((_heading: [string, string]) => {}, []);

	const [searchActive, setSearchActive] = useState(false);

	const [floatHeader, setFloatHeader] = useState(false);

	const [showInfoCardId, setShowInfoCardId] = useState<string>("");

	// Instant local filtering with useMemo

	const filteredProducts = useMemo(() => {

		const search = searchValue.trim().toLowerCase();

		const cat = selectedCategory.trim().toLowerCase();

		return menus.filter(({ name, description, category }) => {

			const matchesSearch =

				!search || name?.toLowerCase().includes(search) || description?.toLowerCase().includes(search) || category?.toLowerCase().includes(search);

			const matchesCat = cat === "all" || category?.toLowerCase() === cat;

			return matchesSearch && matchesCat;

		});

	}, [menus, searchValue, selectedCategory]);

	const imageProducts = useMemo(() => filteredProducts.filter((product) => !product.hidden && Boolean(product.image)), [filteredProducts]);

	const nonImageProducts = useMemo(() => filteredProducts.filter((product) => !product.hidden && !product.image), [filteredProducts]);

	// O(1) quantity lookup for all menu cards

	const selectedQuantityMap = useMemo(() => {

		const map = new Map<string, number>();

		for (const p of selectedProducts) {

			map.set(String(p._id), p.quantity);

		}

		return map;

	}, [selectedProducts]);

	const onMenuScroll = (event: UIEvent<HTMLDivElement>) => {

		const scrollTop = (event.target as HTMLDivElement).scrollTop;

		if (scrollTop > 30) {

			setFloatHeader(true);

			setTopHeading(["Menu", "Category"]);

			if (order?.current && scrollTop >= order?.current?.offsetTop - 15) setTopHeading(orderHeading);

			return;

		}

		return setFloatHeader(false);

	};

	const onCategoryClick = useCallback(

		(categoryName: string) => {

			setSelectedCategory((prev) => {

				const next = categoryName.toLowerCase() === "all" || prev.toLowerCase() === categoryName.toLowerCase() ? "all" : categoryName;

				params.set({ category: next === "all" ? "" : next }, { shallow: true });

				return next;

			});

		},

		[params],

	);

	const allCategories = useMemo(() => {

		const cats = restaurant?.profile?.categories || [];

		return ["all", ...cats];

	}, [restaurant?.profile?.categories]);

	const handleScrollLeft = useCallback(() => {

		const currentIdx = allCategories.findIndex((c) => c.toLowerCase() === selectedCategory.toLowerCase());

		const prevIdx = currentIdx > 0 ? currentIdx - 1 : allCategories.length - 1;

		const targetCat = allCategories[prevIdx];

		if (targetCat) {

			onCategoryClick(targetCat);

			setTimeout(() => {

				const activeEl = categories.current?.querySelector(".menuCategory.active") as HTMLElement | null;

				activeEl?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });

			}, 50);

		} else if (categories.current) {

			categories.current.scrollBy({ left: -220, behavior: "smooth" });

		}

	}, [allCategories, selectedCategory, onCategoryClick]);

	const handleScrollRight = useCallback(() => {

		const currentIdx = allCategories.findIndex((c) => c.toLowerCase() === selectedCategory.toLowerCase());

		const nextIdx = currentIdx >= 0 && currentIdx < allCategories.length - 1 ? currentIdx + 1 : 0;

		const targetCat = allCategories[nextIdx];

		if (targetCat) {

			onCategoryClick(targetCat);

			setTimeout(() => {

				const activeEl = categories.current?.querySelector(".menuCategory.active") as HTMLElement | null;

				activeEl?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });

			}, 50);

		} else if (categories.current) {

			categories.current.scrollBy({ left: 220, behavior: "smooth" });

		}

	}, [allCategories, selectedCategory, onCategoryClick]);

	const handleIncreaseProduct = useCallback(

		(item: TMenuCustom) => {

			increaseProductQuantity(item);

			setSideSheetOpen(true);

		},

		[increaseProductQuantity, setSideSheetOpen],

	);

	const onSearchChange = useCallback(

		(val: string) => {

			setSearchValue(val);

			params.set({ search: val }, { shallow: true });

		},

		[params],

	);

	const onLoginClick = useCallback(() => {

		if (!params.get("table")) {

			params.set({ table: "1" });

		}

		setLoginOpen(true);

	}, [params, setLoginOpen]);

	useEffect(() => {

		if (session.data?.role === "customer") setOrderHeading(["Choose", "Order"]);

		else setOrderHeading(["Explore", "Menu"]);

	}, [session.data?.role]);

	return (

		<div className="orderPage">

			{(loading || restaurantLoading) && <div className="globalTopLoader" />}

			<div className="mainContainer" onScroll={onMenuScroll}>

				<div className={`mainHeader ${searchActive ? "searchActive" : ""} ${floatHeader ? "floatHeader" : ""}`}>

					<h1>

						{topHeading[0]} <span>{topHeading[1]}</span>

					</h1>

					<div className="options">

						<SearchButton setSearchActive={setSearchActive} placeholder="Search menu" value={searchValue} setValue={onSearchChange} />

						{session.data?.role === "customer" ? (

							<div className="customerProfileBadge" title="Logged in customer">

								<span className="customerName">👤 {session.data.customer?.fname || "Guest"}</span>

								<button

									type="button"

									className="customerSignoutBtn"

									title="Log out"

									onClick={() => signOut({ callbackUrl: window.location.pathname + window.location.search })}>

									✕

								</button>

							</div>

						) : !session.data?.role ? (

							<Button className="loginButton" label="Login" onClick={onLoginClick} />

						) : null}

						<Button

							icon="e43b"

							iconType="solid"

							label={selectedProducts?.length > 0 ? `${selectedProducts.length}` : activeOrder?.products?.length ? "Receipt" : ""}

							onClick={() => setSideSheetOpen(true)}

						/>

					</div>

				</div>

				{restaurant && (

					<div className="category">

						<button

							type="button"

							className="categoryScrollBtn scrollLeft"

							aria-label="Previous category"

							title="Previous category"

							onClick={handleScrollLeft}>

							‹

						</button>

						<div className="itemCategories" ref={categories}>

							<ActionCard className={`menuCategory ${selectedCategory === "all" ? "active" : ""}`} onClick={() => onCategoryClick("all")}>

								<span className="title">All</span>

							</ActionCard>

							{restaurant?.profile?.categories?.map((item, i) => (

								<ActionCard

									key={i}

									className={`menuCategory ${selectedCategory.toLowerCase() === item.toLowerCase() ? "active" : ""}`}

									onClick={() => onCategoryClick(item)}>

									<span className="title">{item}</span>

								</ActionCard>

							))}

						</div>

						<button

							type="button"

							className="categoryScrollBtn scrollRight"

							aria-label="Next category"

							title="Next category"

							onClick={handleScrollRight}>

							›

						</button>

					</div>

				)}

				{!restaurant ? (

					<Spinner label="Loading Menu..." fullpage />

				) : (

					<div className="order" ref={order}>

						<div className="header">

							<h1>

								{orderHeading[0]} <span>{orderHeading[1]}</span>

							</h1>

						</div>

						{imageProducts.length > 0 && (

							<div className="itemContainer">

								<div>

									{imageProducts.map((item) => (

										<MenuCard

											key={String(item._id)}

											item={item}

											increaseQuantity={handleIncreaseProduct}

											decreaseQuantity={decreaseProductQuantity}

											showInfo={showInfoCardId === String(item._id)}

											setShowInfo={(v) => setShowInfoCardId(v ? String(item._id) : "")}

											show={true}

											quantity={selectedQuantityMap.get(String(item._id)) || 0}

										/>

									))}

								</div>

							</div>

						)}

						{imageProducts.length > 0 && nonImageProducts.length > 0 && <hr />}

						{nonImageProducts.length > 0 && (

							<div className="itemContainer withoutImage">

								<div>

									{nonImageProducts.map((item) => (

										<MenuCard

											key={String(item._id)}

											item={item}

											increaseQuantity={handleIncreaseProduct}

											decreaseQuantity={decreaseProductQuantity}

											showInfo={showInfoCardId === String(item._id)}

											setShowInfo={(v) => setShowInfoCardId(v ? String(item._id) : "")}

											show={true}

											quantity={selectedQuantityMap.get(String(item._id)) || 0}

										/>

									))}

								</div>

							</div>

						)}

					</div>

				)}

			</div>

			<SideSheet title={sideSheetHeading} open={sideSheetOpen} setOpen={setSideSheetOpen}>

				{loading ? (

					<Spinner label="Loading Order..." fullpage />

				) : (

					<CartPage

						selectedProducts={selectedProducts}

						increaseProductQuantity={increaseProductQuantity}

						decreaseProductQuantity={decreaseProductQuantity}

						resetSelectedProducts={resetSelectedProducts}

						setSideSheetHeading={setSideSheetHeading}

					/>

				)}

			</SideSheet>

			<Modal open={loginOpen} setOpen={setLoginOpen}>

				<UserLogin setOpen={setLoginOpen} />

			</Modal>

		</div>

	);

};

export default OrderPage;

type TMenuCustom = TMenu & { quantity: number };

