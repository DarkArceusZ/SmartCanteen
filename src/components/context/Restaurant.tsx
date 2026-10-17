import { usePathname } from "next/navigation";
import { createContext, type ReactNode } from "react";
import useSWR from "swr";

import type { TAccount } from "#utils/database/models/account";
import { fetcher } from "#utils/helper/common";

const RestaurantDefault: TRestaurantInitialType = {
	restaurant: undefined,
	error: undefined,
	loading: false,
};

export const RestaurantContext = createContext(RestaurantDefault);
export const RestaurantProvider = ({ children, initialRestaurant }: TRestaurantProviderProps) => {
	const pathname = usePathname();
	const restaurantId = pathname ? pathname.replace(/^\//, "").split("/")[0] : "";
	const {
		data: restaurant,
		error,
		isLoading,
	} = useSWR(restaurantId ? `/api/menu?id=${restaurantId}` : null, fetcher, {
		fallbackData: initialRestaurant,
		revalidateOnFocus: false,
		revalidateIfStale: false,
	});

	const activeRestaurant = restaurant ?? initialRestaurant;
	return <RestaurantContext.Provider value={{ restaurant: activeRestaurant, error, loading: isLoading && !activeRestaurant }}>{children}</RestaurantContext.Provider>;
};

export type TRestaurantProviderProps = {
	children?: ReactNode;
	initialRestaurant?: TAccount;
};

export type TRestaurantInitialType = {
	restaurant?: TAccount;
	error: unknown;
	loading: boolean;
};
