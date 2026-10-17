"use client";

import { SessionProvider } from "next-auth/react";
import { type ReactNode, Suspense } from "react";
import { XProvider } from "xtreme-ui";

import { ToastManager } from "#components/base/ToastManager";

import type { TAccount } from "#utils/database/models/account";
import { AdminProvider } from "./Admin";
import { OrderProvider } from "./Order";
import { RestaurantProvider } from "./Restaurant";

export const GlobalProvider = ({ children }: ProviderProps) => {
	return (
		<XProvider>
			<SessionProvider>
				<Suspense>{children}</Suspense>
			</SessionProvider>
		</XProvider>
	);
};

export const CustomerProvider = ({ children, initialRestaurant }: CustomerProviderProps) => {
	return (
		<RestaurantProvider initialRestaurant={initialRestaurant}>
			<ToastManager />
			<OrderProvider>{children}</OrderProvider>
		</RestaurantProvider>
	);
};

export const DashboardProvider = ({ children }: ProviderProps) => {
	return (
		<SessionProvider>
			<AdminProvider>
				<ToastManager />
				{children}
			</AdminProvider>
		</SessionProvider>
	);
};
interface ProviderProps {
	children?: ReactNode;
}
interface CustomerProviderProps extends ProviderProps {
	initialRestaurant?: TAccount;
}
