"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "xtreme-ui";
import Modal from "#components/layout/Modal";
import type { TTable } from "#utils/database/models/table";

import "./tableSelectModal.scss";

interface TableSelectModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	currentTable?: string;
	tables?: TTable[];
	restaurantUsername?: string;
	onSelectTable: (tableNum: string) => void;
}

export default function TableSelectModal({ open, setOpen, currentTable, tables = [], onSelectTable }: TableSelectModalProps) {
	const router = useRouter();

	const cleanTables =
		tables.length > 0
			? tables
			: [
					{ name: "Table 1", username: "1" },
					{ name: "Table 2", username: "2" },
					{ name: "Table 3", username: "3" },
					{ name: "Table 4", username: "4" },
				];

	const handleTableClick = (tableNum: string) => {
		onSelectTable(tableNum);
		setOpen(false);
	};

	return (
		<Modal open={open} setOpen={setOpen}>
			<div className="tableSelectModalCard">
				<div className="modalHeader">
					<div className="headerBadge">🍽️ Table Ordering</div>
					<h2 className="title">Select Your Table</h2>
					<p className="subtitle">The kitchen needs your table number so chefs know where to deliver your freshly prepared food.</p>
				</div>

				<div className="sectionBlock">
					<span className="sectionTitle">1. Pick a Table (Instant Demo / Testing)</span>
					<div className="tableGrid">
						{cleanTables.map((t, idx) => {
							const tableVal = t.username || String(idx + 1);
							const isSelected = currentTable === tableVal || currentTable === t.name;
							return (
								<button key={idx} type="button" className={`tableChoiceBtn ${isSelected ? "selected" : ""}`} onClick={() => handleTableClick(tableVal)}>
									<span className="tableIcon">🪑</span>
									<span className="tableName">{t.name || `Table ${tableVal}`}</span>
									{isSelected && <span className="activeDot">Active</span>}
								</button>
							);
						})}
					</div>
				</div>

				<div className="divider">
					<span>OR</span>
				</div>

				<div className="sectionBlock">
					<span className="sectionTitle">2. Scan Physical QR Code</span>
					<p className="sectionDesc">Sitting at a physical canteen table? Open your phone camera or the web scanner to scan the table's QR sticker.</p>
					<div className="qrActions">
						<Button
							type="secondary"
							label="📷 Open Camera Scanner"
							onClick={() => {
								setOpen(false);
								router.push("/scan");
							}}
						/>
						<Link href={`/qr-codes/table-${currentTable || "1"}.svg`} target="_blank" className="viewQrLink">
							View Table QR SVG ↗
						</Link>
					</div>
				</div>
			</div>
		</Modal>
	);
}
