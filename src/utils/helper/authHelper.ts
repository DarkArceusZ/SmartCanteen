import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "#utils/database/connect";
import { Accounts, type TAccount } from "#utils/database/models/account";
import { Customers } from "#utils/database/models/customer";
import type { AuthUser } from "../../types/next-auth";

import { isEmailValid } from "./common";
import { verifyPassword } from "./passwordHelper";

export const authOptions: AuthOptions = {
	secret: process.env.NEXTAUTH_SECRET || "smartcanteen-fallback-auth-secret-32-chars-long",
	providers: [
		CredentialsProvider({
			id: "restaurant",
			name: "restaurant",
			credentials: {
				username: { label: "Username", type: "text", placeholder: "Enter your username or email" },
				kitchen: { label: "Kitchen Username", type: "text", placeholder: "Enter your kitchen username" },
				password: { label: "Password", type: "password", placeholder: "Enter your password" },
			},
			async authorize(cred) {
				if (!cred?.username) throw new Error("Restaurant username is required");
				if (!cred?.password) throw new Error("Password is required");

				await connectDB();
				const cleaned = cred.username.trim().toLowerCase();
				const credential = isEmailValid(cleaned) ? { email: cleaned } : { username: cleaned };
				const account = await Accounts.findOne<TAccount>(credential).populate("profile").populate({ path: "kitchens" });

				if (!account) throw new Error("Account not found.");

				if (cred?.kitchen) {
					const cleanKitchen = cred.kitchen.trim().toLowerCase();
					const kitchenDoc = account?.kitchens?.find((k) => (k.username || "").trim().toLowerCase() === cleanKitchen);
					if (!kitchenDoc) throw new Error("Kitchen account not found");
					if (!(await verifyPassword(cred.password, kitchenDoc.password))) throw new Error("Invalid kitchen credentials");

					return {
						id: account._id.toString(),
						role: "kitchen" as const,
						themeColor: account?.profile?.themeColor,
						_doc: {
							id: account._id.toString(),
							username: account.username,
							email: account.email,
							kitchen: kitchenDoc.username,
							role: "kitchen" as const,
							accountActive: account.accountActive,
							subscriptionActive: account.subscriptionActive,
							verified: account.verified,
						} as unknown as AuthUser,
					};
				} else {
					if (!(await verifyPassword(cred.password, account.password))) throw new Error("Invalid admin credentials");

					return {
						id: account._id.toString(),
						role: "admin" as const,
						themeColor: account?.profile?.themeColor,
						_doc: {
							id: account._id.toString(),
							username: account.username,
							email: account.email,
							role: "admin" as const,
							accountActive: account.accountActive,
							subscriptionActive: account.subscriptionActive,
							verified: account.verified,
						} as unknown as AuthUser,
					};
				}
			},
		}),
		CredentialsProvider({
			id: "customer",
			name: "customer",
			credentials: {
				restaurant: { label: "Restaurant Username", type: "text", placeholder: "Enter restaurant username" },
				table: { label: "Table ID", type: "string", placeholder: "Enter the table id" },
				phone: { label: "Phone Number", type: "number", placeholder: "Enter your phone number" },
				fname: { label: "Name", type: "text", placeholder: "Enter your name" },
			},
			async authorize(cred) {
				if (!cred?.restaurant) throw new Error("Restaurant id is required");
				if (!cred?.fname) throw new Error("Name is required");
				if (!cred?.phone) throw new Error("Phone number is required");

				await connectDB();
				const cleanRestaurant = cred.restaurant.trim().toLowerCase();
				const customerCred = {
					fname: cred.fname.trim(),
					lname: "",
					phone: cred.phone.trim(),
				};

				let customer = await Customers.findOne({ phone: customerCred.phone });
				if (!customer) customer = await new Customers(customerCred).save();
				else if (customer.fname !== customerCred.fname) {
					customer.fname = customerCred.fname;
					await customer.save();
				}

				const account = await Accounts.findOne<TAccount>({ username: cleanRestaurant }).populate("profile").populate("tables");
				if (!account) throw new Error("Restaurant not found.");

				const tableUsername = cred?.table || account?.tables?.[0]?.username || "1";

				return {
					id: customer._id.toString(),
					role: "customer" as const,
					themeColor: account?.profile?.themeColor,
					_doc: {
						id: customer._id.toString(),
						role: "customer" as const,
						customer: customer.toObject ? customer.toObject() : customer,
						restaurant: {
							username: account?.profile?.restaurantID || account.username,
							table: tableUsername,
							name: account?.profile?.name,
							avatar: account?.profile?.avatar,
						},
					} as unknown as AuthUser,
				};
			},
		}),
	],
	session: { strategy: "jwt" },
	callbacks: {
		async session({ session, token }) {
			if (token?.user) {
				Object.assign(session, token.user);
				session.user = {
					...(session.user || {}),
					...token.user,
				};
			}
			return session;
		},
		async jwt({ token, user }) {
			if (user) {
				token.user = {
					id: user.id,
					role: user.role,
					themeColor: user.themeColor,
					...(user._doc || {}),
				};
			}
			return token;
		},
	},
};
