import clsx from "clsx";
import { memo, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Icon } from "xtreme-ui";

import QuantityButton from "#components/base/QuantityButton";
import type { TMenu } from "#utils/database/models/menu";

import "./menuCard.scss";

const vegIcon = {
	veg: "f4d8",
	"non-veg": "f6d6",
	"contains-egg": "f7fb",
} as const;

const isHoverSupported = typeof window !== "undefined" && Boolean(window.matchMedia?.("(hover: hover)")?.matches);

const MenuCard = (props: TMenuCardProps) => {
	const { className, show = true, restrictOrder, showInfo, setShowInfo, item, quantity } = props;
	const [cardRef, inView] = useInView({ threshold: 0, rootMargin: "400px 0px", triggerOnce: true });
	const [isFlashing, setFlashing] = useState(false);
	const flashTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

	useEffect(() => {
		const itemId = String(item._id);
		const handleHighlight = ((e: CustomEvent<{ id: string }>) => {
			if (e.detail.id === itemId) {
				if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);

				setFlashing(false);
				flashTimeoutRef.current = setTimeout(() => {
					setFlashing(true);
					flashTimeoutRef.current = setTimeout(() => setFlashing(false), 1500);
				}, 10);
			}
		}) as EventListener;

		window.addEventListener("highlight-item", handleHighlight);
		return () => {
			window.removeEventListener("highlight-item", handleHighlight);
			if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
		};
	}, [item._id]);

	const isSoldOut = item.availability === "sold-out";
	const isSpecial = item.availability === "todays-special";

	const classList = clsx(
		"menuCard ",
		className,
		isFlashing && "flash",
		isSoldOut && "soldOut",
		restrictOrder && "restrictOrder",
		showInfo && "showInfo",
		!item.image && "withoutImage",
		isHoverSupported && "hoverSupported",
	);

	if (!show) return null;

	return (
		<div id={`menu-item-${item._id}`} className={classList + (!inView ? "blank" : "")} ref={cardRef}>
			{inView && (
				<>
					{item.image && (
						<div className="picture">
							<span style={{ background: `url(${item.image})` }} />
							<div className="description">{item.description}</div>
						</div>
					)}
					{item.veg && (
						<div className={`vegIcon ${item.veg}`}>
							<Icon className="icon" type="solid" size={16} code={vegIcon[item.veg]} />
							<span className="label">{item.veg.replace(/-/g, " ")}</span>
						</div>
					)}
					<div className="options">
						<div className="title">
							<span>
								{item.name}
								{isSpecial && <span className="specialBadge">⭐ Chef&apos;s Special</span>}
							</span>
							{item.image && (
								<div className="info" onClick={() => setShowInfo(showInfo ? false : !!item._id)}>
									<Icon code={showInfo ? "f00d" : "f05a"} set="duotone" type="solid" />
								</div>
							)}
						</div>
						{!item.image && <div className="description">{item.description}</div>}
						<div className="footer">
							{!item.image && <div className="priceNoImage rupee">{item.price}</div>}
							{isSoldOut ? (
								<span className="soldOutBadge">Sold Out</span>
							) : (
								<QuantityButton
									className="addToCart"
									quantity={quantity}
									filled
									increaseQuantity={() => props.increaseQuantity(item)}
									decreaseQuantity={() => props.decreaseQuantity(item)}
								/>
							)}
						</div>
					</div>
					{item.image && (
						<div className="price rupee">
							<div className="ribbonTop" />
							<div className="ribbonBottom" />
							<span>{item.price}</span>
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default memo(MenuCard);

type TMenuCardProps = {
	className?: string;
	show?: boolean;
	restrictOrder?: boolean;
	showInfo?: boolean;
	setShowInfo: (showInfo: boolean) => void;
	item: TMenuCustom;
	quantity: number;
	increaseQuantity: (item: TMenuCustom) => void;
	decreaseQuantity: (item: TMenuCustom) => void;
};

type TMenuCustom = TMenu & { quantity: number };
