"use client";

import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Button, Spinner } from "xtreme-ui";

import { useAdmin } from "#components/context/useContext";
import type { TAvailability, TMenu } from "#utils/database/models/menu";

import MenuEditorItem from "./MenuEditorItem";
import MenuEditorModal from "./MenuEditorModal";
import "./menuEditor.scss";

const MenuEditor = () => {
	const { profile, menus = [], profileLoading, profileMutate } = useAdmin();
	const [modalOpen, setModalOpen] = useState(false);
	const [editItem, setEditItem] = useState<TMenu | null>(null);
	const [hideSettingsLoading, setHideSettingsLoading] = useState<string[]>([]);
	const [selectedCategory, setSelectedCategory] = useState<string>("all");

	const filteredMenus = useMemo(() => {
		if (selectedCategory === "all") return menus;
		return menus.filter((m) => m.category?.toLowerCase() === selectedCategory.toLowerCase());
	}, [menus, selectedCategory]);

	const onHide = async (itemId: string, hidden: boolean) => {
		setHideSettingsLoading((v) => [...v, itemId]);
		try {
			const req = await fetch("/api/admin/menu/hidden", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ itemId, hidden }),
			});
			const res = await req.json();

			if (res?.status !== 200) toast.error(res?.message || "Failed to update visibility");
			else await profileMutate();
		} catch {
			toast.error("Failed to update visibility");
		} finally {
			setHideSettingsLoading((v) => v.filter((item) => item !== itemId));
		}
	};

	const onAvailabilityChange = async (itemId: string, availability: TAvailability) => {
		try {
			const req = await fetch("/api/admin/menu/availability", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ itemId, availability }),
			});
			const res = await req.json();
			if (res?.status !== 200) toast.error(res?.message || "Failed to update availability");
			else {
				toast.success(`Item set to ${availability}`);
				await profileMutate();
			}
		} catch {
			toast.error("Failed to update availability");
		}
	};

	const onEdit = (item: TMenu) => {
		setEditItem(item);
		setModalOpen(true);
	};

	const onAddNew = () => {
		setEditItem(null);
		setModalOpen(true);
	};

	if (profileLoading) return <Spinner fullpage label="Loading Menu..." />;

	return (
		<div className="menuEditor">
			<div className="menuCategoryEditor">
				<div className="menuCategoryHeader">
					<h1 className="menuCategoryHeading">Menu Categories</h1>
					<div className="menuCategoryOptions" />
				</div>
				<div className="menuCategoryContainer">
					<div className={`menuCategory ${selectedCategory === "all" ? "active" : ""}`} onClick={() => setSelectedCategory("all")}>
						<span className="title">All ({menus.length})</span>
					</div>
					{profile?.categories?.map((item, i) => {
						const count = menus.filter((m) => m.category?.toLowerCase() === item.toLowerCase()).length;
						return (
							<div
								key={i}
								className={`menuCategory ${selectedCategory.toLowerCase() === item.toLowerCase() ? "active" : ""}`}
								onClick={() => setSelectedCategory(item)}>
								<span className="title">
									{item} ({count})
								</span>
							</div>
						);
					})}
				</div>
			</div>

			<div className="menuItemEditor">
				<div className="menuItemHeader">
					<h1 className="menuItemHeading">
						Menu Items <span>({filteredMenus.length})</span>
					</h1>
					<Button label="+ Add Dish" onClick={onAddNew} size="mini" />
				</div>
				<div className="menuItemContainer">
					{filteredMenus.length === 0 ? (
						<div className="emptyMenuNotice">
							<p>No dishes found in this category.</p>
							<Button label="Add First Dish" size="mini" onClick={onAddNew} />
						</div>
					) : (
						filteredMenus.map((item, id) => (
							<MenuEditorItem
								key={id}
								item={item}
								onEdit={onEdit}
								onHide={onHide}
								onAvailabilityChange={onAvailabilityChange}
								hideSettingsLoading={hideSettingsLoading.includes(item._id.toString())}
							/>
						))
					)}
				</div>
			</div>

			<Button className="menuEditorAdd" onClick={onAddNew} icon="2b" iconType="solid" title="Add Dish" />

			<MenuEditorModal open={modalOpen} setOpen={setModalOpen} item={editItem} categories={profile?.categories || []} onSaved={profileMutate} />
		</div>
	);
};

export default MenuEditor;
