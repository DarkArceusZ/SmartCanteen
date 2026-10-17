"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { Spinner } from "xtreme-ui";

export default function Logout() {
	const session = useSession();
	const triggeredRef = useRef(false);

	useEffect(() => {
		if (triggeredRef.current) return;
		triggeredRef.current = true;

		const targetUrl =
			session.data?.role === "customer" && session.data?.restaurant?.username && session.data?.restaurant?.table
				? `/${session.data.restaurant.username}?table=${session.data.restaurant.table}`
				: "/";

		signOut({ callbackUrl: targetUrl });
	}, [session.data?.restaurant?.table, session.data?.restaurant?.username, session.data?.role]);

	return (
		<div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
			<Spinner fullpage label="Signing out..." />
		</div>
	);
}
