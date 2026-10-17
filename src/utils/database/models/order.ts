import mongoose, { type HydratedDocument } from "mongoose";

import type { TCustomer } from "./customer";
import type { TMenu } from "./menu";

const orderState = ["active", "reject", "cancel", "complete"] as const;
const kitchenState = ["new", "preparing", "ready"] as const;
const paymentMethods = ["cash", "upi"] as const;

const OrderSchema = new mongoose.Schema<TOrder>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true },
		table: { type: String, trim: true, lowercase: true, required: true },
		customer: { type: mongoose.Schema.Types.ObjectId, ref: "customers" },
		state: { type: String, trim: true, lowercase: true, enum: orderState, default: "active" },
		kitchenStatus: { type: String, trim: true, lowercase: true, enum: kitchenState, default: "new" },
		paymentMethod: { type: String, trim: true, lowercase: true, enum: paymentMethods, default: "cash" },
		rejectReason: { type: String, trim: true },
		orderTotal: { type: Number },
		taxTotal: { type: Number },
		products: [
			{
				product: { type: mongoose.Schema.Types.ObjectId, ref: "menus" },
				quantity: { type: Number, default: 1 },
				price: { type: Number, required: true },
				tax: { type: Number, required: true },
				adminApproved: { type: Boolean, default: false },
				fulfilled: { type: Boolean, default: false },
			},
		],
	},
	{ timestamps: true },
);

OrderSchema.pre("save", function () {
	this.orderTotal = 0;
	this.taxTotal = 0;
	this?.products?.forEach(({ quantity, price, tax }) => {
		this.orderTotal += price * quantity;
		this.taxTotal += Number(((tax || 0) * (quantity || 1)).toFixed(2));
	});
	this.orderTotal = Number(this.orderTotal.toFixed(2));
	this.taxTotal = Number(this.taxTotal.toFixed(2));
});

export const Orders = mongoose.models?.orders ?? mongoose.model<TOrder>("orders", OrderSchema);
export type TOrder = HydratedDocument<{
	restaurantID: string;
	table: string;
	customer: TCustomer;
	state: (typeof orderState)[number];
	kitchenStatus?: (typeof kitchenState)[number];
	paymentMethod?: (typeof paymentMethods)[number];
	rejectReason?: string;
	orderTotal: number;
	taxTotal: number;
	products: Array<TProduct>;
	createdAt: Date;
	updatedAt: Date;
}>;

export type TProduct = TMenu & {
	_id: mongoose.Types.ObjectId;
	product: TMenu;
	quantity: number;
	price: number;
	tax: number;
	fulfilled: boolean;
	adminApproved: boolean;
};
