"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button, Lottie } from "xtreme-ui";

import { useOrder, useRestaurant } from "#components/context/useContext";
import Collapsible from "#components/layout/Collapsible";
import NoContent from "#components/layout/NoContent";
import { getAnimSrc } from "#utils/constants/common";
import type { TMenu } from "#utils/database/models/menu.js";
import type { TProduct } from "#utils/database/models/order.js";

import ItemCard from "../../../../components/layout/ItemCard";
import "./cartPage.scss";

const CartPage = (props: TCartPageProps) => {
	const { selectedProducts, increaseProductQuantity, decreaseProductQuantity, resetSelectedProducts } = props;
	const { restaurant } = useRestaurant();
	const { order, placeOrder, placingOrder, cancelOrder, cancelingOrder, dismissCompletedOrder, setLoginOpen } = useOrder();
	const session = useSession();

	const [showOrderHistory, setShowOrderHistory] = useState(false);
	const [selectionTotal, setSelectionTotal] = useState(0);
	const [bottomBarActive, setBottomBarActive] = useState(false);
	const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi">("cash");

	const approvedProducts = order?.products?.reduce((acc, product) => (product.adminApproved ? acc + 1 : acc), 0) ?? 0;

	useEffect(() => {
		if (!selectedProducts.length) setShowOrderHistory(true);
		else setShowOrderHistory(false);

		setSelectionTotal(
			selectedProducts.reduce((total, product) => {
				return total + product.quantity * product.price;
			}, 0),
		);
	}, [selectedProducts]);

	const onPlaceOrder = async () => {
		if (selectedProducts.length === 0) return;
		if (session.status !== "authenticated") {
			setLoginOpen(true);
			return;
		}
		await placeOrder(selectedProducts, paymentMethod);
		resetSelectedProducts();
	};

	const onCancelOrder = async () => {
		await cancelOrder();
		resetSelectedProducts();
	};

	// 1. If Order was REJECTED: Show rejection reason and allow "Start Another Order"
	if (order && order.state === "reject") {
		return (
			<div className="cartPage">
				<div className="orderStatusContainer rejected">
					<div className="statusIcon">⚠️</div>
					<h2>Order Cancelled</h2>
					<p className="statusMsg">{order.rejectReason || "The canteen was unable to accept this order at this time."}</p>
					<div className="statusMeta">
						<span>Table {order.table}</span>
						<span>Total: ₹{order.orderTotal}</span>
					</div>
					<Button
						type="primary"
						label="Start Another Order"
						onClick={() => {
							dismissCompletedOrder();
							resetSelectedProducts();
						}}
					/>
				</div>
			</div>
		);
	}

	// 2. If Order is COMPLETE: Show Digital Receipt with Print & Order Again
	if (order && order.state === "complete") {
		const orderDate = new Date((order as unknown as { updatedAt: string }).updatedAt || new Date()).toLocaleString();
		return (
			<div className="cartPage">
				<div className="digitalReceipt">
					<div className="receiptHeader">
						<div className="checkIcon">✓</div>
						<h2>Order Completed</h2>
						<p className="canteenName">{restaurant?.profile?.name || "SmartCanteen"}</p>
						<p className="orderMeta">
							Order #{order._id.toString().slice(-6).toUpperCase()} • Table {order.table}
						</p>
						<p className="orderTime">{orderDate}</p>
					</div>

					<div className="receiptDetails">
						<div className="detailRow">
							<span>Customer</span>
							<strong>
								{order.customer?.fname} {order.customer?.lname || ""}
							</strong>
						</div>
						<div className="detailRow">
							<span>Payment Method</span>
							<strong>{order.paymentMethod === "upi" ? "📱 UPI at Counter" : "💵 Cash at Counter"}</strong>
						</div>
					</div>

					<div className="receiptItems">
						<div className="itemsHeader">
							<span>Item</span>
							<span>Qty</span>
							<span>Price</span>
						</div>
						{order.products?.map((item: TProduct, idx: number) => (
							<div key={idx} className="itemReceiptRow">
								<span className="itemTitle">{item.name}</span>
								<span className="itemQty">{item.quantity}x</span>
								<span className="itemPrice">₹{item.price * item.quantity}</span>
							</div>
						))}
					</div>

					<div className="receiptTotals">
						<div className="totRow">
							<span>Subtotal</span>
							<span>₹{order.orderTotal}</span>
						</div>
						<div className="totRow">
							<span>Tax</span>
							<span>₹{order.taxTotal}</span>
						</div>
						<div className="totRow grandTotal">
							<span>Grand Total</span>
							<strong>₹{Number((order.orderTotal + order.taxTotal).toFixed(2))}</strong>
						</div>
					</div>

					<div className="receiptActions">
						<Button type="secondary" label="Print Receipt" onClick={() => window.print()} />
						<Button
							type="primary"
							label="Start Another Order"
							onClick={() => {
								dismissCompletedOrder();
								resetSelectedProducts();
							}}
						/>
					</div>
				</div>
			</div>
		);
	}

	// 3. Cart is Empty: Show original NoContent
	if (!selectedProducts.length && !order?.products?.length) {
		return (
			<div className="cartPage">
				<NoContent label={"Aren't you hungry?"} animationName="FoodBurgerHappy" />
			</div>
		);
	}

	// 4. Order submitted and waiting for canteen acceptance
	if (order?.products?.length && approvedProducts === 0 && !selectedProducts.length) {
		return (
			<div className="cartPage">
				<div className="cartApproval">
					<Lottie className="burgerLoader" src={getAnimSrc("FoodCook")} size={180} />
					<div className="approvalHeading">
						<p>Your order</p>
						<p>will be accepted soon</p>
					</div>

					<div className="waitingOrderList">
						<h4>Items in this order (Table {order.table})</h4>
						{order.products.map((p, idx) => (
							<div key={idx} className="waitingOrderItem">
								<span className="qty">{p.quantity}x</span>
								<span className="name">{p.name}</span>
								<span className="price">₹{p.price * p.quantity}</span>
							</div>
						))}
						<div className="waitingTotal">
							<span>Order Total</span>
							<strong>₹{order.orderTotal}</strong>
						</div>
					</div>

					<Button className="endOrder" type="secondaryDanger" size="mini" label="Cancel Order" loading={cancelingOrder} onClick={onCancelOrder} />
				</div>
			</div>
		);
	}

	// 5. Active Cart & Order View
	return (
		<div className="cartPage">
			<div className="cartItems">
				{order?.kitchenStatus === "ready" && (
					<div className="readyPickupBanner">
						🔔 <strong>Table {order.table}</strong>: Your food is ready for pickup at the counter!
					</div>
				)}
				{order?.kitchenStatus === "preparing" && (
					<div className="prepStatusBanner">
						🍳 <strong>Table {order.table}</strong>: Chef is preparing your meal right now.
					</div>
				)}

				{order?.products?.length && approvedProducts > 0 && (
					<Collapsible
						className="orderedProducts"
						round
						label={`Ordered Items (${order.products.length})`}
						expand={showOrderHistory}
						setExpand={setShowOrderHistory}
						alert={order.products.length}>
						{order.products.map((product, key) => (
							<ItemCard key={key} item={product as unknown as TMenuCustom} staticCard />
						))}
					</Collapsible>
				)}

				{selectedProducts.length > 0 ? (
					<>
						<div className="selectedProducts">
							<div className="sectionSubHead">Items in your cart:</div>
							{selectedProducts.map((product, key) => (
								<ItemCard item={product} key={key} increaseQuantity={increaseProductQuantity} decreaseQuantity={decreaseProductQuantity} />
							))}
						</div>

						{/* Payment Method Selector */}
						<div className="paymentMethodSelector">
							<div className="sectionSubHead">Choose Payment Method:</div>
							<div className="paymentOptions">
								<div className={`payOption ${paymentMethod === "cash" ? "selected" : ""}`} onClick={() => setPaymentMethod("cash")}>
									<div className="radioDot">{paymentMethod === "cash" && "●"}</div>
									<div className="optionText">
										<strong>💵 Pay at Counter</strong>
										<span>Pay cash to canteen cashier</span>
									</div>
								</div>
								<div className={`payOption ${paymentMethod === "upi" ? "selected" : ""}`} onClick={() => setPaymentMethod("upi")}>
									<div className="radioDot">{paymentMethod === "upi" && "●"}</div>
									<div className="optionText">
										<strong>📱 Online Payment (UPI)</strong>
										<span>Scan UPI QR Code to pay</span>
									</div>
								</div>
							</div>

							{paymentMethod === "upi" ? (
								<div className="onlinePaymentQrCard">
									<div className="upiQrHeader">
										<span className="upiBadge">⚡ Instant UPI Payment</span>
										<h4>Harshvardhansinh Gohil</h4>
										<span className="upiId">
											UPI ID: <strong>hpgohil2006@okicici</strong>
										</span>
									</div>
									<div className="qrImageFrame">
										<Image src="/payment/upi_qr.jpg" alt="UPI Payment QR Code" width={200} height={200} className="qrCodeImg" priority />
									</div>
									<div className="qrPayAmount">
										Amount to Pay: <strong>₹{selectionTotal}</strong>
									</div>
									<p className="scanHint">Scan with Google Pay, PhonePe, Paytm, or any UPI app</p>
								</div>
							) : (
								<div className="cashPaymentCard">
									<span className="cashIcon">💵</span>
									<h4>Pay Cash at Canteen Counter</h4>
									<p>
										Please pay <strong>₹{selectionTotal}</strong> in cash at the counter when collecting your meal.
									</p>
								</div>
							)}
						</div>
					</>
				) : (
					<div style={{ textAlign: "center", padding: "24px 20px", color: "var(--colorContentSecondary)", fontSize: "0.9rem" }}>
						Need more food? Select items from the menu to add to your order.
					</div>
				)}
			</div>

			{selectedProducts.length > 0 && (
				<div className={`cartCheckout ${bottomBarActive ? "active" : ""}`}>
					<div className="checkoutHeader">
						<div
							className="orderTotal"
							onClick={() => {
								setBottomBarActive((v) => !v);
							}}>
							{bottomBarActive ? (
								<h5>
									Bill <span>Summary</span>
								</h5>
							) : (
								<>
									<p>Total to Pay</p>
									<span className="totalValue rupee">{selectionTotal} </span>
									<span className="plusTaxes"> + taxes at counter</span>
								</>
							)}
						</div>
						<div className="cartAction">
							<Button
								iconType="solid"
								size="mini"
								icon={bottomBarActive ? "f078" : "e1bc"}
								label={
									bottomBarActive
										? "close"
										: paymentMethod === "upi"
											? `₹${selectionTotal} | Paid via UPI - Place Order`
											: `₹${selectionTotal} | Pay Cash - Place Order`
								}
								loading={placingOrder}
								onClick={onPlaceOrder}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default CartPage;

type TCartPageProps = {
	selectedProducts: Array<TMenuCustom>;
	increaseProductQuantity: (product: TMenuCustom) => void;
	decreaseProductQuantity: (product: TMenuCustom) => void;
	resetSelectedProducts: () => void;
	setSideSheetHeading: (heading: [string, string]) => void;
};

type TMenuCustom = TMenu & { quantity: number };
