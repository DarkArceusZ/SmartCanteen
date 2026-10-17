"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button, Textfield } from "xtreme-ui";
import Modal from "#components/layout/Modal";
import type { TAvailability, TMenu, TVeg } from "#utils/database/models/menu";

import "./menuEditorModal.scss";

interface MenuEditorModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item?: TMenu | null;
	categories: string[];
	onSaved: () => Promise<void>;
}

export default function MenuEditorModal({ open, setOpen, item, categories, onSaved }: MenuEditorModalProps) {
	const isEdit = Boolean(item?._id);

	const [name, setName] = useState("");
	const [category, setCategory] = useState("");
	const [price, setPrice] = useState("");
	const [veg, setVeg] = useState<TVeg>("veg");
	const [availability, setAvailability] = useState<TAvailability>("available");
	const [description, setDescription] = useState("");
	const [image, setImage] = useState("");
	const [hidden, setHidden] = useState(false);

	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		if (item) {
			setName(item.name || "");
			setCategory(item.category || (categories[0] ?? "general"));
			setPrice(item.price ? String(item.price) : "");
			setVeg(item.veg || "veg");
			setAvailability(item.availability || "available");
			setDescription(item.description || "");
			setImage(item.image || "");
			setHidden(Boolean(item.hidden));
		} else {
			setName("");
			setCategory(categories[0] ?? "general");
			setPrice("");
			setVeg("veg");
			setAvailability("available");
			setDescription("");
			setImage("");
			setHidden(false);
		}
	}, [item, categories]);

	const handleSave = async () => {
		if (!name.trim()) return toast.error("Please enter a dish name");
		if (!price || Number.isNaN(Number(price)) || Number(price) <= 0) return toast.error("Please enter a valid price");
		if (!category) return toast.error("Please select a category");

		setSaving(true);
		try {
			const res = await fetch("/api/admin/menu", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					_id: item?._id ? item._id.toString() : undefined,
					name: name.trim(),
					category: category.toLowerCase().trim(),
					price: Number(price),
					veg,
					availability,
					description: description.trim(),
					image: image.trim(),
					hidden,
				}),
			});

			const data = await res.json();
			if (!res.ok || data.status >= 400) {
				toast.error(data.message || "Failed to save dish");
				return;
			}

			toast.success(data.message || "Dish saved successfully");
			await onSaved();
			setOpen(false);
		} catch (_err) {
			toast.error("Network error while saving dish");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!item?._id) return;
		if (!confirm(`Are you sure you want to delete "${name}" from the menu?`)) return;

		setDeleting(true);
		try {
			const res = await fetch("/api/admin/menu", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ itemId: item._id.toString() }),
			});
			const data = await res.json();
			if (!res.ok || data.status >= 400) {
				toast.error(data.message || "Failed to delete dish");
				return;
			}

			toast.success(data.message || "Dish deleted successfully");
			await onSaved();
			setOpen(false);
		} catch {
			toast.error("Network error while deleting dish");
		} finally {
			setDeleting(false);
		}
	};

	return (
		<Modal open={open} setOpen={setOpen}>
			<div className="menuEditorModalCard">
				<h2 className="modalHeading">{isEdit ? "Edit Menu Dish" : "Add New Dish"}</h2>
				<p className="modalSubheading">{isEdit ? "Update dish details, pricing, and availability" : "Add a fresh item to your canteen catalog"}</p>

				<div className="formGrid">
					<div className="formGroup full">
						<label htmlFor="dish-input-name">Dish Name *</label>
						<Textfield
							id="dish-input-name"
							placeholder="e.g. Masala Dosa, Cold Coffee"
							value={name}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
						/>
					</div>

					<div className="formGroup half">
						<label htmlFor="dish-input-price">Price (₹) *</label>
						<Textfield
							id="dish-input-price"
							type="number"
							placeholder="e.g. 80"
							value={price}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
						/>
					</div>

					<div className="formGroup half">
						<label htmlFor="dish-select-category">Category *</label>
						<select id="dish-select-category" className="selectInput" value={category} onChange={(e) => setCategory(e.target.value)}>
							{categories.map((c, i) => (
								<option key={i} value={c.toLowerCase()}>
									{c}
								</option>
							))}
						</select>
					</div>

					<div className="formGroup half">
						<label htmlFor="dish-select-veg">Dietary Type *</label>
						<select id="dish-select-veg" className="selectInput" value={veg} onChange={(e) => setVeg(e.target.value as TVeg)}>
							<option value="veg">🟢 Vegetarian</option>
							<option value="non-veg">🔴 Non-Vegetarian</option>
							<option value="contains-egg">🟡 Contains Egg</option>
						</select>
					</div>

					<div className="formGroup half">
						<label htmlFor="dish-select-availability">Stock / Availability</label>
						<select
							id="dish-select-availability"
							className="selectInput"
							value={availability}
							onChange={(e) => setAvailability(e.target.value as TAvailability)}>
							<option value="available">🟢 In Stock</option>
							<option value="sold-out">🔴 Sold Out</option>
							<option value="todays-special">⭐ Chef&apos;s Special</option>
						</select>
					</div>

					<div className="formGroup full">
						<label htmlFor="dish-input-desc">Description (Optional)</label>
						<Textfield
							id="dish-input-desc"
							placeholder="Short delicious description, ingredients..."
							value={description}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
						/>
					</div>

					<div className="formGroup full">
						<label htmlFor="dish-input-image">Image URL (Optional)</label>
						<Textfield
							id="dish-input-image"
							placeholder="https://... image link"
							value={image}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImage(e.target.value)}
						/>
					</div>

					<div className="formGroup full checkboxRow">
						<label className="checkboxLabel">
							<input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
							<span>Hide from customer menu for now</span>
						</label>
					</div>
				</div>

				<div className="modalActions">
					{isEdit && <Button className="btnDelete" type="secondary" label="Delete Dish" loading={deleting} onClick={handleDelete} />}
					<div className="rightButtons">
						<Button type="secondary" label="Cancel" onClick={() => setOpen(false)} />
						<Button label={isEdit ? "Update Dish" : "Add Dish"} loading={saving} onClick={handleSave} />
					</div>
				</div>
			</div>
		</Modal>
	);
}
