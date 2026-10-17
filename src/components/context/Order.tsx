import noop from "lodash/noop";
import pick from "lodash/pick";
import { useSession } from "next-auth/react";
import { createContext, type ReactNode, useEffect, useState } from "react";
import { toast } from "react-toastify";
import useSWR from "swr";

import type { TMenu } from "#utils/database/models/menu";
import type { TOrder } from "#utils/database/models/order";
import { fetcher } from "#utils/helper/common";

const OrderDefault: TOrderInitialType = {
	order: undefined,
	orderHistory: [],
	loading: false,
	placeOrder: () => new Promise(noop),
	placingOrder: false,
	cancelOrder: noop,
	cancelingOrder: false,
	loginOpen: false,
	setLoginOpen: noop,
	dismissCompletedOrder: noop,
};

export const OrderContext = createContext(OrderDefault);
export const OrderProvider = ({ children }: TOrderProviderProps) => {
	const session = useSession();
	const authenticated = session.status === "authenticated";
	const {
		data: rawOrder,
		isLoading: loading,
		mutate,
	} = useSWR(authenticated ? "/api/order" : null, fetcher, {
		refreshInterval: 4000,
	});
	const { data: orderHistory = [], mutate: mutateHistory } = useSWR(authenticated ? "/api/order/history" : null, fetcher, {
		refreshInterval: 8000,
	});

	const [dismissedOrderId, setDismissedOrderId] = useState<string | null>(null);
	const [placingOrder, setPlacingOrder] = useState(false);
	const [cancelingOrder, setCancelingOrder] = useState(false);
	const [loginOpen, setLoginOpen] = useState(false);

	const order = rawOrder && rawOrder._id === dismissedOrderId ? undefined : rawOrder;

	const dismissCompletedOrder = () => {
		if (rawOrder?._id) {
			setDismissedOrderId(rawOrder._id);
		}
	};

	const placeOrder = async (products: Array<TMenuCustom>, paymentMethod?: "cash" | "upi") => {
		setPlacingOrder(true);
		setDismissedOrderId(null);
		const req = await fetch("/api/order/place", {
			method: "POST",
			body: JSON.stringify({
				products: products.map((product) => pick(product, ["_id", "quantity"])),
				paymentMethod: paymentMethod || "cash",
			}),
		});
		const res = await req.json();

		if (!req.ok) toast.error(res?.message || "Failed to place order");
		else toast.success(res?.message || "Order placed successfully!");
		await mutate();
		await mutateHistory();
		setPlacingOrder(false);
	};

	const cancelOrder = async () => {
		setCancelingOrder(true);
		const req = await fetch("/api/order/cancel", { method: "POST" });
		const res = await req.json();

		if (!req.ok) toast.error(res?.message);
		else toast.warn("Order cancelled");
		await mutate();
		await mutateHistory();
		setCancelingOrder(false);
	};

	useEffect(() => {
		mutate();
	}, [mutate]);

	return (
		<OrderContext.Provider
			value={{
				order,
				orderHistory,
				loading,
				placeOrder,
				placingOrder,
				cancelOrder,
				cancelingOrder,
				loginOpen,
				setLoginOpen,
				dismissCompletedOrder,
			}}>
			{children}
		</OrderContext.Provider>
	);
};

export type TOrderProviderProps = {
	children?: ReactNode;
};

export type TOrderInitialType = {
	order?: TOrder;
	orderHistory: TOrder[];
	loading: boolean;
	placeOrder: (products: Array<TMenuCustom>, paymentMethod?: "cash" | "upi") => Promise<void>;
	placingOrder: boolean;
	cancelOrder: () => void;
	cancelingOrder: boolean;
	loginOpen: boolean;
	setLoginOpen: (open: boolean) => void;
	dismissCompletedOrder: () => void;
};
type TMenuCustom = TMenu & { quantity: number };
