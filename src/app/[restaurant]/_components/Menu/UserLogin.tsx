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
	const [page, setPage] = useState("phone");
	const [buttonLabel, setButtonLabel] = useState("Next");
	const [busy, setBusy] = useState(false);

	const [dialCode] = useState("91");
	const [phone, setPhone] = useState("");

	const [fname, setFName] = useState("");
	const [lname, setLName] = useState("");
	const [heading, setHeading] = useState(["Let's", " start ordering"]);

	const rawDigits = phone.replace(/[^\d]/g, "");
	const cleanPhone = rawDigits.startsWith("91") && rawDigits.length > 10 ? rawDigits.slice(2) : rawDigits;
	const phoneNumber = `+${dialCode}${cleanPhone}`;

	const onNext = async () => {
		if (page === "phone") {
			if (cleanPhone.length < 7 || cleanPhone.length > 15) {
				return toast.error("Please enter a valid phone number");
			}

			setBusy(true);
			setTimeout(() => {
				setBusy(false);
				setPage("details");
			}, 300);
		} else if (page === "details") {
			if (!fname.trim()) {
				return toast.error("Please enter your first name");
			}
			const tableNum = params.get("table") || "1";

			setBusy(true);

			const res = await signIn("customer", {
				redirect: false,
				restaurant: pathname.replaceAll("/", "").toLowerCase(),
				phone: phoneNumber,
				fname: fname.trim(),
				lname: lname.trim(),
				table: tableNum,
				callbackUrl: `${window.location.origin}`,
			});

			if (res?.error) {
				toast.error(res?.error);
				setBusy(false);
				return;
			}

			toast.success(`Welcome, ${fname.trim()}!`);
			setOpen(false);
			setBusy(false);
		}
	};

	useEffect(() => {
		if (page === "phone") {
			setHeading(["Let's", " start ordering"]);
			setButtonLabel("Next");
		} else if (page === "details") {
			setHeading(["Just a few", " more details"]);
			setButtonLabel("Order");
		}
	}, [page]);

	return (
		<div className={`userLogin ${page}`}>
			<div className="header">
				<span className="heading">
					<span>{heading[0]}</span>
					{heading[1]}
				</span>
			</div>
			<div className="content">
				<Textfield
					id="user-login-phone"
					className="phone"
					type="phone"
					autoComplete="tel-local"
					value={phone}
					onEnterKey={onNext}
					onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
				/>
				<div className="detailsContainer">
					<Textfield
						id="user-login-fname"
						className="fName"
						placeholder="First Name"
						autoComplete="given-name"
						value={fname}
						onChange={(e: ChangeEvent<HTMLInputElement>) => setFName(e.target.value)}
					/>
					<Textfield
						id="user-login-lname"
						className="lName"
						placeholder="Last Name"
						autoComplete="family-name"
						onEnterKey={onNext}
						value={lname}
						onChange={(e: ChangeEvent<HTMLInputElement>) => setLName(e.target.value)}
					/>
				</div>
			</div>
			<div className="footer">
				<Button label={buttonLabel} onClick={onNext} loading={busy} />
			</div>
		</div>
	);
};

export default UserLogin;

type UserLoginProps = {
	setOpen: (open: boolean) => void;
};
