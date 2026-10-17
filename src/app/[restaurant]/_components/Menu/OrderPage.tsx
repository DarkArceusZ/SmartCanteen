import { signOut, useSession } from "next-auth/react";
import { type UIEvent, useEffect, useMemo, useRef, useState } from "react";
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
	const { loading, loginOpen, setLoginOpen } = useOrder();
	const { restaurant } = useRestaurant();

	const menus = restaurant?.menus as Array<TMenuCustom>;
	const params = useQueryParams();
	const table = params.get("table");
	const searchParam = params.get("search")?.trim() ?? "";
	const categoryParam = params.get("category")?.trim();
	const selectedCategory = useMemo(() => {
		if (!categoryParam || categoryParam.toLowerCase() === "all") return "all";
		return categoryParam;
	}, [categoryParam]);

	const order = useRef<HTMLDivElement>(null);
	const categories = useRef<HTMLDivElement>(null);
	const [sideSheetOpen, setSideSheetOpen] = useState(false);
	const [topHeading, setTopHeading] = useState(["Menu", "Category"]);
	const [orderHeading, setOrderHeading] = useState(["Explore", "Menu"]);
	const [sideSheetHeading, setSideSheetHeading] = useState(["Your", "Order"]);

	const [searchActive, setSearchActive] = useState(false);
	const [searchValue, setSearchValue] = useState("");
	const [floatHeader, setFloatHeader] = useState(false);
	const [showInfoCard, setShowInfoCard] = useState(false);

	const filteredProducts = useMemo(() => {
		const search = searchParam.toLowerCase();
		return (
			menus?.filter?.(
				({ name, description, category: cat }) =>
					(search ? name?.toLowerCase().includes(search) || description?.toLowerCase().includes(search) || cat?.toLowerCase().includes(search) : true) &&
					(selectedCategory === "all" ? true : cat?.toLowerCase() === selectedCategory.toLowerCase()),
			) ?? []
		);
	}, [menus, searchParam, selectedCategory]);

	const [selectedProducts, setSelectedProducts] = useState<Array<TMenuCustom>>([]);
	const hasImageItems = useMemo(() => filteredProducts?.some((product) => !product.hidden && !!product.image) ?? false, [filteredProducts]);
	const hasNonImageItems = useMemo(() => filteredProducts?.some((product) => !product.hidden && !product.image) ?? false, [filteredProducts]);

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
	const onCategoryClick = (categoryName: string) => {
		if (categoryName.toLowerCase() === "all" || selectedCategory.toLowerCase() === categoryName.toLowerCase()) {
			params.set({ category: "" });
		} else {
			params.set({ category: categoryName });
		}
	};
	const onLoginClick = () => {
		if (!table) {
			params.set({ table: "1" });
		}
		setLoginOpen(true);
	};
	const increaseProductQuantity = (product: TMenuCustom) => {
		if (product.availability === "sold-out") {
			toast.error("Sorry, this item is currently sold out!");
			return;
		}
		if (!table) {
			params.set({ table: "1" });
		}
		const selection = [...selectedProducts];
		if (selectedProducts.some((item) => item._id === product._id)) {
			selection.forEach((item) => {
				if (product._id === item._id) item.quantity++;
			});
		} else {
			product.quantity = 1;
			selection.push(product);
		}
		setSelectedProducts(selection);
		setSideSheetOpen(true);
	};
	const decreaseProductQuantity = (product: TMenuCustom) => {
		let selection = [...selectedProducts];
		selection.forEach((item) => {
			if (product._id === item._id) {
				item.quantity--;
				if (item.quantity === 0) {
					const filter = selection.filter((tempItem) => tempItem._id !== product._id);
					selection = [...filter];
				}
			}
		});
		setSelectedProducts(selection);
	};

	useEffect(() => {
		if (selectedCategory !== "all" && restaurant?.profile?.categories?.length) {
			const exists = restaurant.profile.categories.some((c) => c.toLowerCase() === selectedCategory.toLowerCase());
			if (!exists) {
				params.set({ category: "" });
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedCategory, restaurant?.profile?.categories, params.set]);
	useEffect(() => {
		params.set({ search: searchValue });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchValue, params.set]);

	useEffect(() => {
		if (session.data?.role === "customer") setOrderHeading(["Choose", "Order"]);
		else setOrderHeading(["Explore", "Menu"]);
	}, [session]);

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
						<SearchButton setSearchActive={setSearchActive} placeholder="Search menu" value={searchValue} setValue={setSearchValue} />
						{!session.data?.role && <Button className="loginButton" label="Login" onClick={onLoginClick} />}
						<Button
							icon="e43b"
							iconType="solid"
							label={`${selectedProducts?.length > 0 ? selectedProducts?.length : ""}`}
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
						{hasImageItems && (
							<div className="itemContainer">
								<div>
									{filteredProducts?.map(
										(item, key) =>
											!item.hidden && (
												<MenuCard
													key={key}
													item={item}
													increaseQuantity={increaseProductQuantity}
													decreaseQuantity={decreaseProductQuantity}
													showInfo={item._id.toString() === showInfoCard.toString()}
													setShowInfo={(v) => setShowInfoCard(v)}
													show={!!item.image}
													quantity={
														(selectedProducts.some((obj) => obj._id === item._id) &&
															selectedProducts?.find((obj) => obj._id === item._id)?.quantity) ||
														0
													}
												/>
											),
									)}
								</div>
							</div>
						)}
						{hasImageItems && hasNonImageItems && <hr />}
						{hasNonImageItems && (
							<div className="itemContainer withoutImage">
								<div>
									{filteredProducts?.map((item, key) => (
										<MenuCard
											key={key}
											item={item}
											increaseQuantity={increaseProductQuantity}
											decreaseQuantity={decreaseProductQuantity}
											showInfo={item._id.toString() === showInfoCard.toString()}
											setShowInfo={(v) => setShowInfoCard(v)}
											show={!!item.image}
											quantity={
												(selectedProducts.some((obj) => obj._id === item._id) &&
													selectedProducts?.find((obj) => obj._id === item._id)?.quantity) ||
												0
											}
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
