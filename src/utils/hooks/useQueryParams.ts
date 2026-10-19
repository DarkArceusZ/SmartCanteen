import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { createQueryString } from "#utils/helper/common";

export const useQueryParams = () => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const get = useCallback((key: string) => searchParams.get(key), [searchParams]);
	const set = useCallback(
		(query: Record<string, string>, options?: { shallow?: boolean }) => {
			const newQuery = createQueryString(searchParams, query);
			const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
			if (options?.shallow && typeof window !== "undefined") {
				window.history.replaceState(null, "", newUrl);
			} else {
				router.replace(newUrl, { scroll: false });
			}
		},
		[pathname, router, searchParams],
	);

	return useMemo(() => ({ pathname, router, get, set }), [pathname, router, get, set]);
};
