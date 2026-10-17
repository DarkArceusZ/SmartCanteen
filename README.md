# SmartCanteen AI

## Smart Canteen Ordering and Management System

SmartCanteen AI is a college canteen ordering system for browsing a menu, ordering from a
table, getting menu help from the optional Jarvis assistant, and processing orders through an
admin dashboard. This README is the handoff guide for our private college group repository.

> This project is configured for local/demo use. Keep the repository private while it contains
> seeded demo credentials, and never commit real secrets.

## What the project includes

- Customer menu for a restaurant/table URL
- Cart and order placement without installing a mobile app
- Table-aware ordering using QR codes
- Admin dashboard for order requests and order status updates
- Kitchen role and kitchen route (the current kitchen screen is intentionally limited; see
  [Kitchen workflow](#kitchen-workflow))
- Optional Jarvis AI assistant for menu questions and recommendations
- Reviews, contact, explore, responsive layouts, and dark themed UI
- NextAuth role separation for customer, admin, and kitchen sessions

## ⚡ Quick Start (Run in 1 Step)

### On Windows:
Double-click `run.bat` (or execute `.\run.bat` in terminal).
This automatically starts both the local embedded database and the Next.js development server.

### On Mac / Linux:
```bash
chmod +x run.sh
./run.sh
```

### Manual Start:
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Start the embedded local MongoDB instance:
   ```bash
   pnpm run db
   ```
3. In a second terminal, start the Next.js web application:
   ```bash
   pnpm play
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Prerequisites
1. **Node.js 20 or newer** (LTS recommended). Check with `node --version`.
2. **pnpm**. Install with `corepack enable` and check with `pnpm --version`.
3. Embedded MongoDB is already bundled inside `scripts/start-db.mjs`! (No external database installation needed).

### 2. Install dependencies

```bash
pnpm install
```

### 3. Create local environment variables

Create a file named `.env.local` in the project root. Start from this template and replace the
placeholders with your own private values:

```env
MONGODB_URI=<YOUR_MONGODB_CONNECTION_STRING>
NEXTAUTH_SECRET=<YOUR_LONG_RANDOM_NEXTAUTH_SECRET>
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
AI_GOOGLE_KEY=<YOUR_GOOGLE_GEMINI_API_KEY>
```

Notes:

- `MONGODB_URI` must point to the MongoDB database containing the demo restaurant data.
- `NEXTAUTH_SECRET` should be a long random value. Do not reuse a public example in a deployed
  environment.
- `AI_GOOGLE_KEY` is optional for the core menu and ordering workflow. Leave it blank if Jarvis
  is not being demonstrated.
- Do not commit `.env.local` or paste its contents into chat, issues, or pull requests.

### 4. Start the development server

```bash
pnpm play
```

Open [http://localhost:3000](http://localhost:3000) on the laptop running the server. Stop the
server with `Ctrl+C`.

## Useful scripts

These commands are defined in `package.json`:

| Command | Purpose |
| --- | --- |
| `pnpm play` | Start the Next.js development server on port 3000 |
| `pnpm build` | Create a production build and catch compile/type errors |
| `pnpm start` | Start the most recent production build |
| `pnpm lint` | Run Biome and apply the repository's formatting/lint rules |

## 🔐 Authentication & Roles

NextAuth.js handles secure authentication and role separation for Student, Kitchen, and Admin:

| Role | Username | Password | Purpose |
| --- | --- | --- | --- |
| Admin | `starbucks` | `123456` | Full Admin Dashboard & Menu Management (`/dashboard`) |
| Kitchen Staff | `starbucksKitchen1` | `123456` | Live KDS Kanban Board (`/kitchen`) |
| Secondary Admin | `empire` | `123456` | Empire Restaurant Dashboard |

### Customer access

Customers do not have a fixed password. On the restaurant menu page they enter their name and
phone number; the app creates or finds the customer record and signs them in for that restaurant
and table. Use fake test data during demos, such as `Test User` and `9999999999`.

## Customer workflow

1. Open [Table 1 menu](http://localhost:3000/starbucks?table=1), or use a table QR code.
2. **Category Filter**: Easy single-selection categories with an **"All"** button at the beginning. Click any category to filter exclusively by it, and click "All" (or re-click the active category) to show all items.
3. Ask Jarvis for recommendations if `AI_GOOGLE_KEY` is configured.
4. Add items to the cart and review the total.
5. Enter the customer's name and phone number when prompted.
6. Submit the order and keep the confirmation screen available for the demo.
7. Use the Reviews, Explore, and Contact sections from the customer navigation when needed.

### 📱 Table QR Codes & Testing:
To test the customer ordering experience:
- Use the generated table QR codes in `public/qr-codes/` (e.g. `public/qr-codes/table-1.svg`).
- Or open [http://localhost:3000/starbucks?table=1](http://localhost:3000/starbucks?table=1) in your browser.

The customer session should be tested in a separate browser profile or phone from the admin
session. One browser profile has one shared NextAuth session, so logging in as a customer and
admin in the same profile will replace the previous session.

## Admin workflow

1. Open the homepage: [http://localhost:3000](http://localhost:3000).
2. Use the seeded admin credentials above in the restaurant login section.
3. Open [Admin Dashboard](http://localhost:3000/dashboard).
4. Open **Orders → Requests** to see newly submitted customer orders.
5. Confirm the order's restaurant, table number, items, and total.
6. Accept/process the order using the available status controls.
7. Check the active/completed status tabs to verify that the order moves through the workflow.

Orders retain their table number, so Table 1 and Table 2 orders can be distinguished in the
dashboard order cards and detail panel.

## Kitchen workflow

The `/kitchen` route is protected for admin and kitchen roles. It provides a live Kitchen Display System (KDS) featuring a 3-column Kanban board:

1. **New Orders**: Incoming accepted orders waiting to be prepared. Kitchen staff clicks **"Start Preparing"** to claim and begin cooking.
2. **Preparing**: Actively cooking items with an itemized checklist. Once cooking is finished, staff clicks **"Mark Ready"**.
3. **Ready for Pickup**: Orders awaiting pickup. Instantly broadcasts a live pickup alert with table number to the customer's phone/screen. Once handed over, staff clicks **"Complete"**.
4. Real-time auto-sync refreshes the board every 4 seconds without manual reloading.

## QR codes and LAN testing

The repository includes generated SVGs here:

- `public/qr-codes/table-1.svg`
- `public/qr-codes/table-2.svg`

### Laptop-only testing

`localhost` is reachable only from the laptop running Next.js:

- `http://localhost:3000/starbucks?table=1`
- `http://localhost:3000/starbucks?table=2`

### Phone testing on the same Wi-Fi

Find the laptop's LAN IP and replace the host in the URL. The example IP used for the current
demo is `192.168.29.86`:

- `http://192.168.29.86:3000/starbucks?table=1`
- `http://192.168.29.86:3000/starbucks?table=2`

This address is not permanent. It works only while the phone and laptop are on the same Wi-Fi
network and the development server is running. Teammates must use their own laptop LAN IP and
may need to regenerate the QR SVGs. If the phone cannot connect, check the IP, Wi-Fi, macOS
firewall prompt, and whether port 3000 is listening.

## Recommended demo setup

- **Laptop normal browser:** log in as admin and keep the dashboard's Orders → Requests tab open.
- **Phone or incognito browser:** open a Table 1 or Table 2 URL and place a customer order.
- **Database:** confirm MongoDB Atlas Network Access allows the laptop's current public IP before
  the demo.
- **Server:** start `pnpm play` before scanning a QR code; the QR code does not host the app by
  itself.

## Troubleshooting

### MongoDB IP whitelist or connection error

Add the current network IP to MongoDB Atlas Network Access, verify `MONGODB_URI` in `.env.local`,
and restart `pnpm play`. Never print the URI because it can contain a database password.

### `localhost` refused to connect

Make sure the server is running with `pnpm play`, check that the terminal reports port 3000, and
open the exact URL shown in the terminal.

### Port 3000 is already in use

Stop the other development server, or identify the process before stopping it:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

Then restart `pnpm play`.

### Jarvis says “All AI providers exhausted”

Jarvis is optional. Confirm `AI_GOOGLE_KEY` is present in `.env.local`, restart the server after
changing it, and check that the Google key is valid and enabled for the required Gemini API. The
menu, cart, login, and ordering workflows do not require Jarvis.

### Customer and admin sessions appear mixed

NextAuth uses one session cookie per browser profile. Use a phone/incognito window for the
customer and a separate normal browser profile for the admin. The application also protects the
dashboard and kitchen routes by role; do not test both accounts in the same browser profile.

## Project structure

```text
src/app/                         Next.js routes and API endpoints
src/app/[restaurant]/            Customer restaurant experience
src/app/dashboard/               Admin dashboard and order management
src/app/kitchen/                 Protected kitchen route
src/app/api/                     Authentication, menu, order, feedback, and chat APIs
src/utils/database/              MongoDB connection and Mongoose models
src/utils/ai/                    Jarvis provider configuration and switching
public/qr-codes/                 Table QR-code SVG files
```

## Contribution workflow

1. Pull the latest `main` branch.
2. Create a focused branch, for example `feature/customer-reviews` or `fix/order-status`.
3. Make and test the change locally.
4. Run `pnpm build` and the relevant manual workflow.
5. Push the branch and open a pull request.
6. Ask another group member to review the code and test the affected flow.
7. Merge into `main` only after review. Do not commit directly to `main`.

## Security checklist before every commit

- Never commit `.env.local` or `.env.local.backup`.
- Never commit real MongoDB URIs, database passwords, AI keys, or NextAuth secrets.
- Never commit `node_modules/`, `.next/`, `.pnpm-store/`, or `.idea/`.
- Do not commit temporary `*.patch` backup files to the shared repository.
- Keep the seeded demo password limited to this private college repository; change it before any
  real deployment.
- Keep any legal or license files supplied with the project unchanged.

## License and project notices

Keep the repository's legal and license notices unchanged. This README intentionally contains no
external creator links or deployed-site links; it is only the operating guide for our private
college group project.
