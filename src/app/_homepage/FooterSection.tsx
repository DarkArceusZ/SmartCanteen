import Lightings from "./Lightings";
import "./footerSection.scss";

const FooterSection = () => {
	return (
		<section className="footerSection" id="homepage-footer">
			<p>© {new Date().getFullYear()} SmartCanteen AI. College Canteen Ordering System.</p>
			<Lightings />
		</section>
	);
};

export default FooterSection;
