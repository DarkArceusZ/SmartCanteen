import { usePathname, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button, Textfield } from "xtreme-ui";

import "./userLogin.scss";

const UserLogin = ({ setOpen }: UserLoginProps) => {
	const pathname = usePathname();
	const params = useSearchParams();
	const [busy, setBusy] = useState(false);
	const [phone, setPhone] = useState("");
	const [fname, setFName] = useState("");

	useEffect(() => {
		if (typeof window !== "undefined") {
			const savedName = localStorage.getItem("smartcanteen_customer_name");
			const savedPhone = localStorage.getItem("smartcanteen_customer_phone");
			if (savedName) setFName(savedName);
			if (savedPhone) setPhone(savedPhone.replace("+91", ""));
		}
	}, []);

	const rawDigits = phone.replace(/[^\d]/g, "");
	const cleanPhone = rawDigits.startsWith("91") && rawDigits.length > 10 ? rawDigits.slice(2) : rawDigits;
	const phoneNumber = `+91${cleanPhone}`;

	const onLogin = async () => {
		if (!fname.trim()) {
			return toast.error("Please enter your name");
		}
		if (cleanPhone.length < 7 || cleanPhone.length > 15) {
			return toast.error("Please enter a valid phone number");
		}

		setBusy(true);
		const tableNum = params.get("table") || "1";
		const restaurantClean = pathname.replace(/^\//, "").split("/")[0].toLowerCase();

		try {
			const res = await signIn("customer", {
				redirect: false,
				restaurant: restaurantClean,
				phone: phoneNumber,
				fname: fname.trim(),
				table: tableNum,
				callbackUrl: `${window.location.origin}`,
			});

			if (res?.error) {
				toast.error(res?.error);
				setBusy(false);
				return;
			}

			if (typeof window !== "undefined") {
				try {
					localStorage.setItem("smartcanteen_customer_name", fname.trim());
					localStorage.setItem("smartcanteen_customer_phone", phoneNumber);
				} catch {}
			}

			toast.success(`Welcome, ${fname.trim()}!`);
			setOpen(false);
		} catch (err) {
			console.error("Login failed:", err);
			toast.error("Failed to sign in. Please try again.");
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="userLogin directLogin">
			<div className="header">
				<span className="heading">
					<span>Your Details</span> to Order
				</span>
			</div>
			<div className="content directContent">
				<Textfield
					id="user-login-fname"
					className="nameInput"
					placeholder="Enter your name"
					autoComplete="given-name"
					value={fname}
					onChange={(e: ChangeEvent<HTMLInputElement>) => setFName(e.target.value)}
				/>
				<Textfield
					id="user-login-phone"
					className="phoneInput"
					type="phone"
					placeholder="Phone number"
					autoComplete="tel-local"
					value={phone}
					onEnterKey={onLogin}
					onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
				/>
			</div>
			<div className="footer">
				<Button label="Continue" onClick={onLogin} loading={busy} />
			</div>
		</div>
	);
};

export default UserLogin;

type UserLoginProps = {
	setOpen: (open: boolean) => void;
};
