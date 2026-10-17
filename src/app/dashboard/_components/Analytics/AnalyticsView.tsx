"use client";

import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "#utils/helper/common";
import "./analyticsView.scss";

export default function AnalyticsView() {
	const { data, isLoading } = useSWR("/api/admin/analytics", fetcher, { refreshInterval: 6000 });

	if (isLoading || !data) {
		return (
			<div className="analyticsLoading">
				<div className="analyticsSpinner" />
				<p>Loading canteen analytics...</p>
			</div>
		);
	}

	return (
		<div className="analyticsContainer">
			{/* Metric Cards Grid */}
			<div className="metricsGrid">
				<div className="metricCard revCard">
					<span className="cardLabel">Total Revenue</span>
					<h2 className="cardValue">₹{data.totalRevenue?.toLocaleString()}</h2>
					<span className="cardSub">Avg Order: ₹{data.averageOrderValue || 0}</span>
				</div>

				<div className="metricCard ordersCard">
					<span className="cardLabel">Total Orders</span>
					<h2 className="cardValue">{data.totalOrders}</h2>
					<span className="cardSub">
						{data.completedOrders} completed • {data.activeOrders} active
					</span>
				</div>

				<div className="metricCard activeCard">
					<span className="cardLabel">Active in Kitchen</span>
					<h2 className="cardValue">{data.activeOrders}</h2>
					<Link href="/kitchen" className="cardLink">
						Open Kitchen Display →
					</Link>
				</div>

				<div className="metricCard menuCard">
					<span className="cardLabel">Menu & Stock</span>
					<h2 className="cardValue">{data.totalMenuItems} Items</h2>
					<span className="cardSub">
						{data.soldOutCount > 0 ? `⚠️ ${data.soldOutCount} Sold out` : "All items in stock"} • {data.tablesCount} Tables
					</span>
				</div>

				<div className="metricCard ratingCard">
					<span className="cardLabel">Customer Rating</span>
					<h2 className="cardValue">⭐ {data.averageRating || "5.0"}</h2>
					<span className="cardSub">{data.totalReviews || 0} Customer Reviews</span>
				</div>
			</div>

			{/* AI Business & Inventory Insights (Friend 3 Requirement) */}
			{data.insights?.length > 0 && (
				<div className="aiInsightsBox">
					<div className="boxHeader">
						<div className="titleWithIcon">
							<span className="sparkle">✨</span>
							<h3>Jarvis AI Business & Inventory Insights</h3>
						</div>
						<span className="aiBadge">Active Analysis</span>
					</div>
					<div className="insightsGrid">
						{data.insights.map((insight: string, idx: number) => (
							<div key={idx} className="insightItem">
								<p className="insightText">{insight}</p>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Popular Items & Quick Shortcuts */}
			<div className="analyticsRow">
				<div className="popularItemsBox">
					<div className="boxHeader">
						<h3>🔥 Most Popular Items</h3>
						<span className="badge">Top Sellers</span>
					</div>
					{data.popularItems?.length === 0 ? (
						<p className="noDataMsg">No sales recorded yet. Place orders to see trends!</p>
					) : (
						<div className="itemsList">
							{data.popularItems?.map((item: { name: string; count: number; revenue: number }, idx: number) => (
								<div key={idx} className="popularRow">
									<div className="itemRank">#{idx + 1}</div>
									<div className="itemName">{item.name}</div>
									<div className="itemCount">{item.count} orders</div>
									<div className="itemRev">₹{item.revenue}</div>
								</div>
							))}
						</div>
					)}
				</div>

				<div className="quickActionsBox">
					<div className="boxHeader">
						<h3>⚡ Quick Operations</h3>
					</div>
					<div className="actionsList">
						<Link href="/kitchen" className="opButton kds">
							<span className="opIcon">🍳</span>
							<div className="opText">
								<strong>Kitchen Display System</strong>
								<span>View and manage live cooking queue</span>
							</div>
						</Link>

						<Link href="/starbucks" target="_blank" className="opButton menu">
							<span className="opIcon">📱</span>
							<div className="opText">
								<strong>Customer Menu View</strong>
								<span>Preview digital menu</span>
							</div>
						</Link>

						<Link href="/scan" className="opButton scan">
							<span className="opIcon">📷</span>
							<div className="opText">
								<strong>Table QR Scanner</strong>
								<span>Test customer QR camera scanner</span>
							</div>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
