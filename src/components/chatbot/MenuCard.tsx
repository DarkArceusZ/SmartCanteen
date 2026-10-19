import { toast } from "react-toastify";
import { Icon } from "xtreme-ui";
import type { MenuSuggestion } from "../../types/chat";
import { VEG_ICON_CODE } from "../../utils/constants/common";
import type { TMenu } from "../../utils/database/models/menu";
import { useOrder, useRestaurant } from "../context/useContext";
import "./menuCard.scss";

export function MenuCard({ item }: MenuCardProps) {
	const { increaseProductQuantity, setSideSheetOpen } = useOrder();
	const { restaurant } = useRestaurant();

	const handleClick = () => {
		const el = document.getElementById(`menu-item-${item._id}`);
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "center" });
			window.dispatchEvent(new CustomEvent("highlight-item", { detail: { id: String(item._id) } }));
		}
	};

	const handleAddToCart = (e: React.MouseEvent) => {
		e.stopPropagation();
		const allMenus = (restaurant?.menus as Array<TMenu & { quantity: number }>) || [];
		const fullItem =
			allMenus.find((m) => String(m._id) === String(item._id) || m.name.toLowerCase() === item.name.toLowerCase()) ||
			(item as unknown as TMenu & { quantity: number });
		increaseProductQuantity(fullItem, 1);
		toast.success(`Added ${item.name} to cart!`);
		setSideSheetOpen(true);
	};

	return (
		<div className="chatbotMenuCardWrapper">
			<button type="button" onClick={handleClick} className="chatbotMenuCard">
				{item.image && <div className="cardImage" style={{ backgroundImage: `url(${item.image})` }} />}
				<div className="cardDesc">
					<h4 className="cardTitle">{item.name}</h4>
					<p className="cardSubtitle">
						{item.veg && <Icon className={`vegBadge ${item.veg}`} code={VEG_ICON_CODE[item.veg]} type="solid" size={12} />}
						{item.veg && <span className="separator">•</span>}
						<span>₹{item.price}</span>
					</p>
				</div>
			</button>
			<button type="button" className="chatAddBtn" onClick={handleAddToCart} title={`Add ${item.name} to order`}>
				+ Add
			</button>
		</div>
	);
}

interface MenuCardProps {
	item: MenuSuggestion;
}
