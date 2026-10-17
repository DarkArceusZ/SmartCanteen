import { Icon } from "xtreme-ui";

import { useRestaurant } from "#components/context/useContext";

import "./contactPage.scss";

const DEMO_PHONE = "+919876543210";
const DEMO_PHONE_LABEL = "+91 98765 43210";
const DEMO_EMAIL = "contact@smartcanteen.example";
const DEMO_HOURS = "8:00 AM – 8:00 PM";

const ContactPage = () => {
	const { restaurant, loading } = useRestaurant();
	const profile = restaurant?.profile;
	const restaurantName = profile?.name ?? "SmartCanteen AI";
	const address = profile?.address ?? "College campus canteen";
	const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

	if (loading || !restaurant) {
		return <div className="contactPage contactPageLoading">Loading contact details...</div>;
	}

	return (
		<div className="contactPage">
			<div className="contactIntro">
				<p className="eyebrow">Need a hand?</p>
				<h1>
					Contact <span>Us</span>
				</h1>
				<p className="introText">Reach the {restaurantName} team for help with your order or any canteen questions.</p>
			</div>

			<div className="contactCards">
				<a className="contactCard" href={mapUrl} target="_blank" rel="noreferrer">
					<div className="contactIcon">
						<Icon code="f3c5" type="solid" />
					</div>
					<div>
						<p className="cardLabel">Visit us</p>
						<h2>Location</h2>
						<p>{address}</p>
						<span className="cardAction">Open in Maps</span>
					</div>
				</a>

				<a className="contactCard" href={`tel:${DEMO_PHONE}`}>
					<div className="contactIcon">
						<Icon code="f095" type="solid" />
					</div>
					<div>
						<p className="cardLabel">Call us</p>
						<h2>Phone</h2>
						<p>{DEMO_PHONE_LABEL}</p>
						<span className="cardAction">Tap to call</span>
					</div>
				</a>

				<a className="contactCard" href={`mailto:${DEMO_EMAIL}`}>
					<div className="contactIcon">
						<Icon code="f0e0" type="solid" />
					</div>
					<div>
						<p className="cardLabel">Write to us</p>
						<h2>Email</h2>
						<p>{DEMO_EMAIL}</p>
						<span className="cardAction">Send an email</span>
					</div>
				</a>

				<div className="contactCard hoursCard">
					<div className="contactIcon">
						<Icon code="f017" type="solid" />
					</div>
					<div>
						<p className="cardLabel">When to visit</p>
						<h2>Opening hours</h2>
						<p>{DEMO_HOURS}</p>
						<span className="cardAction">Monday – Sunday</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ContactPage;
