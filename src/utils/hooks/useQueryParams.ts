import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef } from "react";

import { createQueryString } from "#utils/helper/common";

export const useQueryParams = () => {
	const router = useRouter();
	const current = { pathname: usePathname(), searchParams: useSearchParams() };
	const ref = useRef(current);
	ref.current = current;

	const get = useCallback((key: string) => ref.current.searchParams.get(key), []);
	const set = useCallback((query: Record<string, string>) => {
		const newQuery = createQueryString(ref.current.searchParams, query);
		const newUrl = newQuery ? `${ref.current.pathname}?${newQuery}` : ref.current.pathname;
		if (typeof window !== "undefined") {
			window.history.replaceState(null, "", newUrl);
		}
	}, []);
	return useMemo(() => ({ pathname: current.pathname, router, get, set }), [current.pathname, router, get, set]);
};
