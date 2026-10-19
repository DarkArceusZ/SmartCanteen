"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "xtreme-ui";

import { useOrder, useRestaurant } from "#components/context/useContext";
import NoContent from "#components/layout/NoContent";
import type { TMenu } from "#utils/database/models/menu.js";
import type { TOrder, TProduct } from "#utils/database/models/order.js";

import ItemCard from "../../../../components/layout/ItemCard";
import "./cartPage.scss";

const CartPage = (props: TCartPageProps) => {
	const { selectedProducts, increaseProductQuantity, decreaseProductQuantity, resetSelectedProducts } = props;
	const { restaurant } = useRestaurant();
	const { order, orderHistory = [], placeOrder, placingOrder, cancelOrder, cancelingOrder, dismissCompletedOrder, setLoginOpen } = useOrder();
	const session = useSession();

	const [selectionTotal, setSelectionTotal] = useState(0);
	const [bottomBarActive, setBottomBarActive] = useState(false);
	const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi">("cash");

	const [viewReceipt, setViewReceipt] = useState(false);
	const [showHistoryView, setShowHistoryView] = useState(false);

	useEffect(() => {
		setSelectionTotal(
			selectedProducts.reduce((total, product) => {
				return total + product.quantity * product.price;
			}, 0),
		);
	}, [selectedProducts]);

	useEffect(() => {
		if (selectedProducts.length > 0 && !viewReceipt) {
			props.setSideSheetHeading?.(["Your", "Cart"]);
		} else if (order?.products?.length) {
			props.setSideSheetHeading?.(["Digital", "Receipt"]);
		} else {
			props.setSideSheetHeading?.(["Your", "Cart"]);
		}
	}, [selectedProducts.length, order?.products?.length, viewReceipt, props]);

	const onPlaceOrder = async () => {
		if (selectedProducts.length === 0) return;
		if (session.status !== "authenticated") {
			setLoginOpen(true);
			return;
		}
		await placeOrder(selectedProducts, paymentMethod);
		resetSelectedProducts();
		setViewReceipt(true);
	};

	const onCancelOrder = async () => {
		await cancelOrder();
		resetSelectedProducts();
		setViewReceipt(false);
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
							setViewReceipt(false);
						}}
					/>
				</div>
			</div>
		);
	}

	// 2. Customer Order History View
	if (showHistoryView) {
		return (
			<div className="cartPage">
				<div className="backToCartBanner" onClick={() => setShowHistoryView(false)}>
					← Back
				</div>
				<div className="customerOrderHistory" style={{ padding: "10px 4px" }}>
					<h3 style={{ margin: "0 0 16px", color: "#f8fafc", fontSize: "1.1rem", fontWeight: 700 }}>Previous Orders ({orderHistory.length})</h3>
					{orderHistory.map((histOrder: TOrder, idx: number) => {
						const date = new Date(
							(histOrder as unknown as { createdAt?: string; updatedAt?: string }).createdAt ||
								(histOrder as unknown as { updatedAt?: string }).updatedAt ||
								new Date(),
						).toLocaleString();
						return (
							<div
								key={idx}
								style={{
									background: "rgba(255, 255, 255, 0.03)",
									border: "1px solid rgba(255, 255, 255, 0.08)",
									borderRadius: "12px",
									padding: "14px 16px",
									marginBottom: "12px",
									display: "flex",
									flexDirection: "column",
									gap: "8px",
								}}>
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
									<strong style={{ color: "#38bdf8", fontSize: "0.9rem" }}>Order #{histOrder._id?.toString().slice(-6).toUpperCase()}</strong>
									<span
										style={{
											fontSize: "0.75rem",
											padding: "2px 8px",
											borderRadius: "999px",
											fontWeight: 600,
											background: histOrder.state === "complete" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
											color: histOrder.state === "complete" ? "#10b981" : "#ef4444",
										}}>
										{histOrder.state === "complete" ? "✓ Completed" : histOrder.state}
									</span>
								</div>
								<div style={{ fontSize: "0.78rem", color: "#64748b" }}>
									{date} • Table {histOrder.table}
								</div>
								<div style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
									{histOrder.products?.map((p: TProduct, i: number) => (
										<div key={i} style={{ display: "flex", justifyContent: "space-between", margin: "3px 0" }}>
											<span>
												{p.quantity}x {p.name}
											</span>
											<span>₹{p.price * p.quantity}</span>
										</div>
									))}
								</div>
								<div
									style={{
										borderTop: "1px dashed rgba(255, 255, 255, 0.1)",
										paddingTop: "8px",
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										fontWeight: 700,
										fontSize: "0.95rem",
									}}>
									<span>Total ({histOrder.paymentMethod === "upi" ? "📱 UPI" : "💵 Cash"})</span>
									<span style={{ color: "#10b981" }}>₹{histOrder.orderTotal}</span>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		);
	}

	// 3. Empty Cart: No order placed and nothing selected
	if (!selectedProducts.length && !order?.products?.length) {
		return (
			<div className="cartPage">
				<NoContent label={"Aren't you hungry?"} animationName="FoodBurgerHappy" />
				{orderHistory.length > 0 && (
					<div style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
						<Button type="secondary" label={`📜 View Previous Orders (${orderHistory.length})`} onClick={() => setShowHistoryView(true)} />
					</div>
				)}
			</div>
		);
	}

	// 4. Digital Receipt: Rendered immediately after payment/order placement as per chosen method
	if (order?.products?.length && (!selectedProducts.length || viewReceipt)) {
		const orderDate = new Date(
			(order as unknown as { createdAt?: string; updatedAt?: string }).createdAt || (order as unknown as { updatedAt?: string }).updatedAt || new Date(),
		).toLocaleString();

		const isCompleted = order.state === "complete";
		const isReady = order.kitchenStatus === "ready";
		const isPreparing = order.kitchenStatus === "preparing";
		const isWaiting = !isCompleted && !isReady && !isPreparing;
		const currentStep = isCompleted ? 4 : isReady ? 3 : isPreparing ? 2 : 1;

		return (
			<div className="cartPage">
				{selectedProducts.length > 0 && (
					<div className="backToCartBanner" onClick={() => setViewReceipt(false)}>
						← Back to Current Cart Selection ({selectedProducts.length} items)
					</div>
				)}

				<div className="digitalReceipt">
					{/* Live Order & Kitchen Status Card */}
					<div className={`receiptStatusCard ${isCompleted ? "statusCompleted" : isReady ? "statusReady" : isPreparing ? "statusPrep" : "statusWaiting"}`}>
						<div className="statusHeaderTop">
							<span className="statusIcon">{isCompleted ? "✓" : isReady ? "🔔" : isPreparing ? "🍳" : "⚡"}</span>
							<div>
								<h3>
									{isCompleted
										? "Order Completed & Served"
										: isReady
											? "Food Ready for Pickup!"
											: isPreparing
												? "Chef is Preparing Your Meal"
												: "Payment Recorded • Order Placed"}
								</h3>
								<p>
									{isCompleted
										? "Thank you for dining with us! Hope to see you again soon."
										: isReady
											? `Table ${order.table} • Please collect your meal at the canteen counter`
											: isPreparing
												? `Table ${order.table} • Your food is being freshly prepared in the kitchen`
												: `Table ${order.table} • Sent to canteen counter. Your order will be accepted shortly.`}
								</p>
							</div>
						</div>

						{/* Live 4-Step Progress Tracker */}
						<div className="receiptTracker">
							<div className={`trackerStep ${currentStep >= 1 ? "active" : ""}`}>
								<div className="stepDot">{currentStep >= 1 ? "✓" : "1"}</div>
								<span>Payment Done</span>
							</div>
							<div className={`trackerLine ${currentStep >= 2 ? "active" : ""}`} />
							<div className={`trackerStep ${currentStep >= 2 ? "active" : ""}`}>
								<div className="stepDot">{currentStep >= 2 ? "✓" : "2"}</div>
								<span>Accepted</span>
							</div>
							<div className={`trackerLine ${currentStep >= 3 ? "active" : ""}`} />
							<div className={`trackerStep ${currentStep >= 3 ? "active" : ""}`}>
								<div className="stepDot">{currentStep >= 3 ? "✓" : "3"}</div>
								<span>Preparing</span>
							</div>
							<div className={`trackerLine ${currentStep >= 4 ? "active" : ""}`} />
							<div className={`trackerStep ${currentStep >= 4 ? "active" : ""}`}>
								<div className="stepDot">{currentStep >= 4 ? "✓" : "4"}</div>
								<span>Ready / Done</span>
							</div>
						</div>
					</div>

					{/* Official Receipt / Tax Invoice Header */}
					<div className="receiptHeader">
						<div className="canteenBrand">
							<h2>{restaurant?.profile?.name || "Smart Canteen"}</h2>
							<span className="taxInvoiceTag">Official Digital Receipt</span>
						</div>
						<p className="orderMeta">
							<strong>Order #{order._id.toString().slice(-6).toUpperCase()}</strong> • Table {order.table}
						</p>
						<p className="orderTime">{orderDate}</p>
					</div>

					{/* Customer & Payment Breakdown */}
					<div className="receiptDetails">
						<div className="detailRow">
							<span>Customer</span>
							<strong>
								{order.customer?.fname} {order.customer?.lname || ""}
							</strong>
						</div>
						{order.customer?.phone && (
							<div className="detailRow">
								<span>Phone</span>
								<strong>{order.customer.phone}</strong>
							</div>
						)}
						<div className="detailRow">
							<span>Payment Method</span>
							<strong>{order.paymentMethod === "upi" ? "📱 Online Payment (UPI)" : "💵 Pay Cash at Counter"}</strong>
						</div>
						<div className="detailRow">
							<span>Payment Status</span>
							<strong className={order.paymentMethod === "upi" ? "upiPaidTag" : "cashPendingTag"}>
								{order.paymentMethod === "upi" ? "✓ Paid via UPI (to Harshvardhansinh Gohil)" : `Pay ₹${order.orderTotal} at Counter`}
							</strong>
						</div>
					</div>

					{/* Itemized Order List */}
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

					{/* Totals */}
					<div className="receiptTotals">
						<div className="totRow">
							<span>Subtotal</span>
							<span>₹{order.orderTotal}</span>
						</div>
						{Boolean(order.taxTotal) && (
							<div className="totRow">
								<span>Taxes & GST</span>
								<span>₹{order.taxTotal}</span>
							</div>
						)}
						<div className="totRow grandTotal">
							<span>Grand Total</span>
							<strong>₹{Number((order.orderTotal + (order.taxTotal || 0)).toFixed(2))}</strong>
						</div>
					</div>

					{/* Receipt Action Buttons */}
					<div className="receiptActions">
						<Button type="secondary" label="🖨️ Print Receipt" onClick={() => window.print()} />
						{isCompleted ? (
							<Button
								type="primary"
								label="Start Another Order"
								onClick={() => {
									dismissCompletedOrder();
									resetSelectedProducts();
									setViewReceipt(false);
								}}
							/>
						) : isWaiting ? (
							<Button type="secondaryDanger" label="Cancel Order" loading={cancelingOrder} onClick={onCancelOrder} />
						) : null}
					</div>

					{orderHistory.length > 0 && (
						<div
							style={{
								textAlign: "center",
								marginTop: "6px",
								cursor: "pointer",
								color: "#38bdf8",
								fontSize: "0.85rem",
								fontWeight: 600,
							}}
							onClick={() => setShowHistoryView(true)}>
							📜 View Previous Orders History ({orderHistory.length})
						</div>
					)}
				</div>
			</div>
		);
	}

	// 4. Active Cart & Order View (when selectedProducts has items)
	return (
		<div className="cartPage">
			<div className="cartItems">
				{order?.products?.length && (
					<div className="viewActiveReceiptBanner" onClick={() => setViewReceipt(true)}>
						🧾 View Active Order Receipt (#{order._id.toString().slice(-6).toUpperCase()})
					</div>
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
