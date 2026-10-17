"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAdmin } from "#components/context/useContext";
import type { TOrder, TProduct } from "#utils/database/models/order";

export default function KitchenBoard() {
	const { data: session } = useSession();
	const { profile, orderActive = [], orderAction, orderActionLoading } = useAdmin();

	const [currentTime, setCurrentTime] = useState("");
	const [activeFilter, setActiveFilter] = useState<"all" | "new" | "preparing" | "ready">("all");
	const [rejectModalOrder, setRejectModalOrder] = useState<TOrder | null>(null);
	const [rejectReason, setRejectReason] = useState("");

	useEffect(() => {
		const updateTime = () => {
			const now = new Date();
			setCurrentTime(
				now.toLocaleTimeString("en-US", {
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					hour12: true,
				}),
			);
		};
		updateTime();
		const interval = setInterval(updateTime, 1000);
		return () => clearInterval(interval);
	}, []);

	const getTimeElapsed = (dateString: string | Date | undefined) => {
		if (!dateString) return "Just now";
		const diffMs = Date.now() - new Date(dateString).getTime();
		const mins = Math.floor(diffMs / 60000);
		if (mins < 1) return "Just now";
		if (mins === 1) return "1m ago";
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		return `${hours}h ${mins % 60}m ago`;
	};

	// Categorize orders into the 3 Kanban columns
	const newOrders = orderActive.filter((o) => !o.kitchenStatus || o.kitchenStatus === "new");
	const preparingOrders = orderActive.filter((o) => o.kitchenStatus === "preparing");
	const readyOrders = orderActive.filter((o) => o.kitchenStatus === "ready");

	const handleStartPreparing = async (orderID: string) => {
		try {
			await orderAction(orderID, "startPreparing");
			toast.info("Order moved to Preparing");
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleMarkReady = async (orderID: string) => {
		try {
			await orderAction(orderID, "markReady");
			toast.success("Order marked Ready for Pickup!");
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleComplete = async (orderID: string) => {
		try {
			await orderAction(orderID, "complete");
			toast.success("Order handed over & completed!");
		} catch {
			toast.error("Failed to complete order");
		}
	};

	const handleConfirmReject = async () => {
		if (!rejectModalOrder) return;
		try {
			await orderAction(rejectModalOrder._id.toString(), "rejectOnActive", rejectReason || "Cancelled by kitchen");
			toast.warn("Order cancelled.");
			setRejectModalOrder(null);
			setRejectReason("");
		} catch {
			toast.error("Failed to cancel order");
		}
	};

	const renderOrderCard = (order: TOrder, lane: "new" | "preparing" | "ready") => {
		const orderIdStr = order._id.toString();
		const customerName = order.customer?.fname ? `${order.customer.fname} ${order.customer.lname || ""}`.trim() : "Customer";

		return (
			<div key={orderIdStr} className={`kdsCard lane-${lane}`}>
				<div className="cardTop">
					<div className="tablePill">TABLE {order.table?.toUpperCase() || "1"}</div>
					<div className="elapsedPill">{getTimeElapsed((order as unknown as { updatedAt: string }).updatedAt)}</div>
				</div>

				<div className="customerRow">
					<span className="name">{customerName}</span>
					{order.paymentMethod && <span className={`paymentBadge ${order.paymentMethod}`}>{order.paymentMethod === "upi" ? "📱 UPI" : "💵 Cash"}</span>}
				</div>

				<div className="itemsBox">
					{order.products?.map((item: TProduct, idx: number) => (
						<div key={idx} className="itemRow">
							<span className="qty">{item.quantity || 1}x</span>
							<span className="itemTitle">{item.name || "Menu Item"}</span>
						</div>
					))}
				</div>

				<div className="cardButtons">
					{lane === "new" && (
						<>
							<button type="button" className="btnAction prepareBtn" disabled={orderActionLoading} onClick={() => handleStartPreparing(orderIdStr)}>
								🍳 Start Preparing
							</button>
							<button type="button" className="btnCancel" disabled={orderActionLoading} onClick={() => setRejectModalOrder(order)}>
								Cancel
							</button>
						</>
					)}

					{lane === "preparing" && (
						<>
							<button type="button" className="btnAction readyBtn" disabled={orderActionLoading} onClick={() => handleMarkReady(orderIdStr)}>
								🔔 Mark Ready
							</button>
							<button type="button" className="btnCancel" disabled={orderActionLoading} onClick={() => setRejectModalOrder(order)}>
								Cancel
							</button>
						</>
					)}

					{lane === "ready" && (
						<button type="button" className="btnAction completeBtn" disabled={orderActionLoading} onClick={() => handleComplete(orderIdStr)}>
							✓ Handed Over / Complete
						</button>
					)}
				</div>
			</div>
		);
	};

	return (
		<div className="kdsWrapper">
			{/* KDS Header Bar */}
			<header className="kdsNavbar">
				<div className="leftMeta">
					<div className="livePulse">
						<span className="pulseCircle" />
						<h1>{profile?.name || "SmartCanteen"} • Kitchen Display</h1>
					</div>
					<div className="clockDisplay">{currentTime}</div>
				</div>

				<div className="rightControls">
					<div className="syncTag">🟢 Live Sync (4s)</div>
					{session?.role === "admin" && (
						<Link href="/dashboard" className="kdsNavBtn">
							Admin Dashboard
						</Link>
					)}
					<Link href="/" className="kdsNavBtn">
						Home Page
					</Link>
					<button type="button" className="kdsNavBtn signout" onClick={() => signOut({ callbackUrl: "/" })}>
						Sign Out
					</button>
				</div>
			</header>

			{/* Responsive Column Filter Tabs on Mobile */}
			<div className="kdsMobileTabs">
				<button type="button" className={activeFilter === "all" ? "active" : ""} onClick={() => setActiveFilter("all")}>
					All ({orderActive.length})
				</button>
				<button type="button" className={activeFilter === "new" ? "active" : ""} onClick={() => setActiveFilter("new")}>
					New ({newOrders.length})
				</button>
				<button type="button" className={activeFilter === "preparing" ? "active" : ""} onClick={() => setActiveFilter("preparing")}>
					Preparing ({preparingOrders.length})
				</button>
				<button type="button" className={activeFilter === "ready" ? "active" : ""} onClick={() => setActiveFilter("ready")}>
					Ready ({readyOrders.length})
				</button>
			</div>

			{/* 3-Column Kanban Board */}
			<main className="kanbanGrid">
				{/* Column 1: New Orders */}
				{(activeFilter === "all" || activeFilter === "new") && (
					<section className="kanbanCol colNew">
						<div className="colHeader">
							<div className="colTitle">
								<span className="colDot newDot" />
								<h2>New Orders</h2>
							</div>
							<span className="colBadge">{newOrders.length}</span>
						</div>
						<div className="cardsContainer">
							{newOrders.length === 0 ? <div className="colEmpty">No new orders</div> : newOrders.map((o) => renderOrderCard(o, "new"))}
						</div>
					</section>
				)}

				{/* Column 2: Preparing */}
				{(activeFilter === "all" || activeFilter === "preparing") && (
					<section className="kanbanCol colPreparing">
						<div className="colHeader">
							<div className="colTitle">
								<span className="colDot prepDot" />
								<h2>Preparing</h2>
							</div>
							<span className="colBadge">{preparingOrders.length}</span>
						</div>
						<div className="cardsContainer">
							{preparingOrders.length === 0 ? (
								<div className="colEmpty">No orders in preparation</div>
							) : (
								preparingOrders.map((o) => renderOrderCard(o, "preparing"))
							)}
						</div>
					</section>
				)}

				{/* Column 3: Ready for Pickup */}
				{(activeFilter === "all" || activeFilter === "ready") && (
					<section className="kanbanCol colReady">
						<div className="colHeader">
							<div className="colTitle">
								<span className="colDot readyDot" />
								<h2>Ready for Pickup</h2>
							</div>
							<span className="colBadge">{readyOrders.length}</span>
						</div>
						<div className="cardsContainer">
							{readyOrders.length === 0 ? <div className="colEmpty">No orders ready for pickup</div> : readyOrders.map((o) => renderOrderCard(o, "ready"))}
						</div>
					</section>
				)}
			</main>

			{/* Safe Confirmation Modal for Canceling/Rejecting */}
			{rejectModalOrder && (
				<div className="modalOverlay" onClick={() => setRejectModalOrder(null)}>
					<div className="modalCard" onClick={(e) => e.stopPropagation()}>
						<h3>Cancel Order for Table {rejectModalOrder.table}</h3>
						<p>Are you sure you want to cancel this order? This action will notify the customer.</p>
						<div className="reasonField">
							<label htmlFor="reasonInput">Reason for cancellation (optional):</label>
							<input
								id="reasonInput"
								type="text"
								placeholder="e.g. Item out of stock, kitchen closing"
								value={rejectReason}
								onChange={(e) => setRejectReason(e.target.value)}
							/>
						</div>
						<div className="modalButtons">
							<button type="button" className="btnModalCancel" onClick={() => setRejectModalOrder(null)}>
								Back
							</button>
							<button type="button" className="btnModalConfirm" onClick={handleConfirmReject}>
								Confirm Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
