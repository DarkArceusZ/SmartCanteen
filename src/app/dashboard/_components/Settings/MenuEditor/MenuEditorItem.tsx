import { useInView } from "react-intersection-observer";
import { Button, Icon, useScreenType } from "xtreme-ui";

import { VEG_ICON_CODE } from "#utils/constants/common";
import type { TAvailability, TMenu } from "#utils/database/models/menu";

import "./menuEditorItem.scss";

const MenuEditorItem = (props: TMenuEditorItemProps) => {
	const { item, onEdit, onHide, onAvailabilityChange, hideSettingsLoading = false } = props;
	const { isMobile } = useScreenType();
	const [itemRef, inView] = useInView({ threshold: 0 });

	return (
		<div className={`menuEditorItem ${item.availability === "sold-out" ? "isSoldOut" : ""}`} ref={itemRef}>
			{inView && (
				<>
					<div className="menuItemPicture">
						{!item.image ? <Icon code="e43b" /> : <span className="image" style={{ background: `url(${item.image})` }} />}
						{item.veg && (
							<div className={`vegIcon ${item.veg}`}>
								<Icon className="icon" type="solid" size={16} code={VEG_ICON_CODE[item.veg]} />
								<span className="label">{item.veg.replace(/-/g, " ")}</span>
							</div>
						)}
					</div>
					<div className="menuItemData">
						<div className="titleAndBadges">
							<h5 className="menuItemTitle">{item.name}</h5>
							{item.availability === "todays-special" && <span className="specialTag">⭐ Chef&apos;s Special</span>}
							{item.availability === "sold-out" && <span className="soldOutTag">Sold Out</span>}
						</div>
						<p className="menuItemDesc">{item.description}</p>
						<p className="menuItemPrice rupee">{item.price}</p>
					</div>
					<div className="menuItemOptions">
						<select
							className="availabilitySelect"
							value={item.availability || "available"}
							onChange={(e) => onAvailabilityChange(item._id.toString(), e.target.value as TAvailability)}
							title="Change item availability">
							<option value="available">🟢 Available</option>
							<option value="sold-out">🔴 Sold Out</option>
							<option value="todays-special">⭐ Special</option>
						</select>
						<Button
							icon={item.hidden ? "f070" : "f06e"}
							iconType="solid"
							size="mini"
							type={item.hidden ? "secondary" : "primary"}
							label={isMobile ? undefined : item.hidden ? "Hidden" : "Visible"}
							loading={hideSettingsLoading}
							onClick={() => onHide(item._id.toString(), !item.hidden)}
						/>
						<Button icon="f304" iconType="solid" size="mini" type="primary" onClick={() => onEdit(item)} />
					</div>
				</>
			)}
		</div>
	);
};

export default MenuEditorItem;

type TMenuEditorItemProps = {
	item: TMenu;
	onEdit: (item: TMenu) => void;
	onHide: (id: string, hidden: boolean) => void;
	onAvailabilityChange: (id: string, availability: TAvailability) => void;
	hideSettingsLoading: boolean;
};
