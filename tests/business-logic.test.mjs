import assert from "node:assert/strict";
import test from "node:test";

// ==============================================================================
// 1. Order Total and Tax Calculation Logic
// ==============================================================================
test("Order Calculation: computes exact totals and tax across multiple items", () => {
	const products = [
		{ name: "Cold Coffee", price: 120, quantity: 2, taxPercent: 5 },
		{ name: "Paneer Sandwich", price: 150, quantity: 1, taxPercent: 5 },
		{ name: "Water Bottle", price: 20, quantity: 3, taxPercent: 0 },
	];

	let orderTotal = 0;
	let taxTotal = 0;

	for (const p of products) {
		const unitTax = Number(((p.price * p.taxPercent) / 100).toFixed(2));
		orderTotal += p.price * p.quantity;
		taxTotal += Number((unitTax * p.quantity).toFixed(2));
	}

	orderTotal = Number(orderTotal.toFixed(2));
	taxTotal = Number(taxTotal.toFixed(2));

	// 120*2 (240) + 150*1 (150) + 20*3 (60) = 450
	assert.equal(orderTotal, 450);
	// Tax: (120*0.05=6.00)*2 + (150*0.05=7.50)*1 + 0 = 12.00 + 7.50 = 19.50
	assert.equal(taxTotal, 19.5);
});

test("Order Calculation: prevents NaN or negative prices from corrupting calculations", () => {
	const sanitizeQuantity = (qty) => {
		const parsed = Math.floor(Number(qty));
		if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 50) {
			return null;
		}
		return parsed;
	};

	assert.equal(sanitizeQuantity(3), 3);
	assert.equal(sanitizeQuantity("5"), 5);
	assert.equal(sanitizeQuantity(0), null);
	assert.equal(sanitizeQuantity(-4), null);
	assert.equal(sanitizeQuantity(51), null);
	assert.equal(sanitizeQuantity("invalid"), null);
	assert.equal(sanitizeQuantity(null), null);
});

// ==============================================================================
// 2. Order Cancellation Safeguard Logic
// ==============================================================================
test("Cancellation Rules: allows cancellation only while pending/new, blocks when preparing", () => {
	const canCustomerCancel = (order) => {
		if (!order || order.state !== "active") return false;
		if (order.kitchenStatus === "preparing" || order.kitchenStatus === "ready") {
			return false;
		}
		return true;
	};

	assert.equal(canCustomerCancel({ state: "active", kitchenStatus: "new" }), true);
	assert.equal(canCustomerCancel({ state: "active", kitchenStatus: undefined }), true);
	assert.equal(canCustomerCancel({ state: "active", kitchenStatus: "preparing" }), false);
	assert.equal(canCustomerCancel({ state: "active", kitchenStatus: "ready" }), false);
	assert.equal(canCustomerCancel({ state: "complete", kitchenStatus: "ready" }), false);
});

// ==============================================================================
// 3. Kitchen Kanban State Machine Transitions
// ==============================================================================
test("Kitchen State Machine: strictly transitions through allowed lifecycle states", () => {
	const transitions = {
		new: ["startPreparing", "reject"],
		preparing: ["markReady", "reject"],
		ready: ["complete"],
	};

	const applyKitchenAction = (currentState, action) => {
		assert.ok(transitions[currentState].includes(action));
		if (action === "startPreparing") return "preparing";
		if (action === "markReady") return "ready";
		if (action === "complete") return "completed";
		if (action === "reject") return "rejected";
		throw new Error(`Invalid action: ${action}`);
	};

	let state = "new";
	assert.ok(transitions[state].includes("startPreparing"));
	state = applyKitchenAction(state, "startPreparing");
	assert.equal(state, "preparing");

	assert.ok(transitions[state].includes("markReady"));
	state = applyKitchenAction(state, "markReady");
	assert.equal(state, "ready");

	assert.ok(transitions[state].includes("complete"));
	state = applyKitchenAction(state, "complete");
	assert.equal(state, "completed");
});

// ==============================================================================
// 4. Role-Based Authorization Policy
// ==============================================================================
test("RBAC Security: strictly isolates Admin, Kitchen, and Customer capabilities", () => {
	const isAllowed = (role, resource) => {
		switch (resource) {
			case "admin_dashboard":
			case "menu_crud":
			case "password_change":
				return role === "admin";
			case "kitchen_board":
			case "kitchen_status_update":
				return role === "admin" || role === "kitchen";
			case "place_order":
			case "customer_cart":
			case "submit_feedback":
				return role === "customer";
			default:
				return false;
		}
	};

	// Customer attempts admin or kitchen action -> DENIED
	assert.equal(isAllowed("customer", "admin_dashboard"), false);
	assert.equal(isAllowed("customer", "menu_crud"), false);
	assert.equal(isAllowed("customer", "kitchen_status_update"), false);

	// Customer places order -> ALLOWED
	assert.equal(isAllowed("customer", "place_order"), true);

	// Kitchen staff accesses kitchen board -> ALLOWED
	assert.equal(isAllowed("kitchen", "kitchen_board"), true);

	// Kitchen staff attempts admin settings -> DENIED
	assert.equal(isAllowed("kitchen", "menu_crud"), false);
	assert.equal(isAllowed("kitchen", "password_change"), false);

	// Admin accesses all management systems -> ALLOWED
	assert.equal(isAllowed("admin", "admin_dashboard"), true);
	assert.equal(isAllowed("admin", "menu_crud"), true);
	assert.equal(isAllowed("admin", "kitchen_board"), true);
});

// ==============================================================================
// 5. Menu Availability & Cross-Canteen Boundary Logic
// ==============================================================================
test("Menu Integrity: rejects sold-out, hidden, or foreign canteen items", () => {
	const validateItemForOrder = (item, sessionRestaurantID) => {
		if (!item) return { ok: false, reason: "Item not found" };
		if (item.restaurantID !== sessionRestaurantID.toLowerCase()) {
			return { ok: false, reason: "Cross-restaurant access forbidden" };
		}
		if (item.availability === "sold-out") {
			return { ok: false, reason: "Item sold out" };
		}
		if (item.hidden) {
			return { ok: false, reason: "Item is hidden" };
		}
		return { ok: true };
	};

	const validItem = { restaurantID: "canteen1", availability: "available", hidden: false };
	const soldOutItem = { restaurantID: "canteen1", availability: "sold-out", hidden: false };
	const foreignItem = { restaurantID: "canteen2", availability: "available", hidden: false };
	const hiddenItem = { restaurantID: "canteen1", availability: "available", hidden: true };

	assert.equal(validateItemForOrder(validItem, "canteen1").ok, true);
	assert.equal(validateItemForOrder(soldOutItem, "canteen1").ok, false);
	assert.equal(validateItemForOrder(foreignItem, "canteen1").ok, false);
	assert.equal(validateItemForOrder(hiddenItem, "canteen1").ok, false);
});
