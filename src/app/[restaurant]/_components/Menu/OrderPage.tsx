import { signOut, useSession } from "next-auth/react";
import { type UIEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
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
	const { loading, loginOpen, setLoginOpen, order: activeOrder } = useOrder();
	const { restaurant } = useRestaurant();

	const menus = useMemo(() => (restaurant?.menus as Array<TMenuCustom>) || [], [restaurant?.menus]);
	const params = useQueryParams();

	const [searchValue, setSearchValue] = useState(() => params.get("search")?.trim() ?? "");
	const [selectedCategory, setSelectedCategory] = useState<string>(() => {
		const cat = params.get("category")?.trim();
		return !cat || cat.toLowerCase() === "all" ? "all" : cat;
	});

	const order = useRef<HTMLDivElement>(null);
	const categories = useRef<HTMLDivElement>(null);
	const [sideSheetOpen, setSideSheetOpen] = useState(false);
	const [topHeading, setTopHeading] = useState(["Menu", "Category"]);
	const [orderHeading, setOrderHeading] = useState(["Explore", "Menu"]);
	const [sideSheetHeading, setSideSheetHeading] = useState(["Your", "Order"]);

	const [searchActive, setSearchActive] = useState(false);
	const [floatHeader, setFloatHeader] = useState(false);
	const [showInfoCardId, setShowInfoCardId] = useState<string>("");
	const [selectedProducts, setSelectedProducts] = useState<Array<TMenuCustom>>([]);

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
				params.set({ category: next === "all" ? "" : next });
				return next;
			});
		},
		[params],
	);

	const onSearchChange = useCallback(
		(val: string) => {
			setSearchValue(val);
			params.set({ search: val });
		},
		[params],
	);

	const onLoginClick = useCallback(() => {
		if (!params.get("table")) {
			params.set({ table: "1" });
		}
		setLoginOpen(true);
	}, [params, setLoginOpen]);

	const increaseProductQuantity = useCallback((product: TMenuCustom) => {
		if (product.availability === "sold-out") {
			toast.error("Sorry, this item is currently sold out!");
			return;
		}
		setSelectedProducts((prev) => {
			const idx = prev.findIndex((item) => String(item._id) === String(product._id));
			if (idx >= 0) {
				const next = [...prev];
				next[idx].quantity += 1;
				return next;
			}
			product.quantity = 1;
			return [...prev, product];
		});
		setSideSheetOpen(true);
	}, []);

	const decreaseProductQuantity = useCallback((product: TMenuCustom) => {
		setSelectedProducts((prev) => {
			const idx = prev.findIndex((item) => String(item._id) === String(product._id));
			if (idx < 0) return prev;
			if (prev[idx].quantity <= 1) {
				return prev.filter((item) => String(item._id) !== String(product._id));
			}
			const next = [...prev];
			next[idx].quantity -= 1;
			return next;
		});
	}, []);

	useEffect(() => {
		if (session.data?.role === "customer") setOrderHeading(["Choose", "Order"]);
		else setOrderHeading(["Explore", "Menu"]);
	}, [session.data?.role]);

	useEffect(() => {
		if (
			session.data?.role === "customer" &&
			restaurant?.username &&
			session.data?.restaurant?.username &&
			session.data.restaurant.username.toLowerCase() !== restaurant.username.toLowerCase()
		) {
			signOut({ redirect: false });
		}
	}, [restaurant?.username, session.data?.restaurant?.username, session.data?.role]);

	return (
		<div className="orderPage">
			<div className="mainContainer" onScroll={onMenuScroll}>
				<div className={`mainHeader ${searchActive ? "searchActive" : ""} ${floatHeader ? "floatHeader" : ""}`}>
					<h1>
						{topHeading[0]} <span>{topHeading[1]}</span>
					</h1>
					<div className="options">
						<SearchButton setSearchActive={setSearchActive} placeholder="Search menu" value={searchValue} setValue={onSearchChange} />
						{!session.data?.role && <Button className="loginButton" label="Login" onClick={onLoginClick} />}
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
											increaseQuantity={increaseProductQuantity}
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
											increaseQuantity={increaseProductQuantity}
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
						resetSelectedProducts={() => setSelectedProducts([])}
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
