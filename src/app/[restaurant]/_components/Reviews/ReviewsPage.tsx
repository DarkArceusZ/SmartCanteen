"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { useRestaurant } from "#components/context/useContext";

import "./reviewsPage.scss";

type Review = { _id: string; rating: number; comment: string; createdAt: string; customer?: { fname?: string; lname?: string } };
type ReviewResponse = { reviews: Review[]; myReview?: Review | null; summary: { average: number; total: number; breakdown: number[] } };
const emptySummary = { average: 0, total: 0, breakdown: [0, 0, 0, 0, 0] };
const demoReviews: Review[] = [
	{
		_id: "demo-1",
		rating: 5,
		comment: "The menu was easy to browse and my order was ready when I reached the counter.",
		createdAt: "2026-07-18T10:00:00.000Z",
		customer: { fname: "Aarav" },
	},
	{
		_id: "demo-2",
		rating: 5,
		comment: "Jarvis helped me choose a cold drink, and ordering from the table made our break much easier.",
		createdAt: "2026-07-12T10:00:00.000Z",
		customer: { fname: "Meera" },
	},
	{
		_id: "demo-3",
		rating: 4,
		comment: "The food was fresh and the ordering experience was quick and relaxed.",
		createdAt: "2026-07-05T10:00:00.000Z",
		customer: { fname: "Rohan" },
	},
];
const formatReviewDate = (value: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));

const ReviewsPage = () => {
	const router = useRouter();
	const session = useSession();
	const { restaurant, loading } = useRestaurant();
	const [data, setData] = useState<ReviewResponse>({ reviews: [], summary: emptySummary });
	const [rating, setRating] = useState(5);
	const [comment, setComment] = useState("");
	const [isLoadingReviews, setIsLoadingReviews] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [message, setMessage] = useState("");
	const [sortOrder, setSortOrder] = useState<"recent" | "highest">("recent");
	const [ratingFilter, setRatingFilter] = useState<"all" | "1" | "2" | "3" | "4" | "5">("all");
	const [showAllReviews, setShowAllReviews] = useState(false);
	const [isEditingReview, setIsEditingReview] = useState(false);
	const restaurantID = restaurant?.profile?.restaurantID;
	const restaurantName = restaurant?.profile?.name ?? "your campus canteen";
	const isCustomer = session.status === "authenticated" && session.data?.role === "customer";

	useEffect(() => {
		if (!restaurantID) return;
		let active = true;
		const loadReviews = async () => {
			setIsLoadingReviews(true);
			try {
				const response = await fetch(`/api/feedback?restaurant=${encodeURIComponent(restaurantID)}`);
				if (!response.ok) throw new Error("Unable to load feedback");
				const reviews = (await response.json()) as ReviewResponse;
				if (active) {
					setData(reviews);
					if (reviews.myReview) {
						setRating(reviews.myReview.rating);
						setComment(reviews.myReview.comment);
					}
				}
			} catch {
				if (active) setMessage("Feedback is temporarily unavailable. Please try again later.");
			} finally {
				if (active) setIsLoadingReviews(false);
			}
		};
		loadReviews();
		return () => {
			active = false;
		};
	}, [restaurantID]);

	useEffect(() => {
		if (!isEditingReview) return;
		requestAnimationFrame(() => document.querySelector(".feedbackForm")?.scrollIntoView({ behavior: "smooth", block: "center" }));
	}, [isEditingReview]);

	const openMenuLogin = () => {
		const params = new URLSearchParams(window.location.search);
		params.set("tab", "menu");
		router.replace(`${window.location.pathname}?${params.toString()}`);
	};

	const openReviewForm = () => {
		setIsEditingReview(true);
	};

	const submitFeedback = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsSubmitting(true);
		setMessage("");
		try {
			const response = await fetch("/api/feedback", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ restaurant: restaurantID, rating, comment }),
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.message ?? "Unable to save feedback");
			setComment("");
			const refreshed = await fetch(`/api/feedback?restaurant=${encodeURIComponent(restaurantID ?? "")}`);
			if (refreshed.ok) {
				const updated = (await refreshed.json()) as ReviewResponse;
				setData(updated);
				setRating(updated.myReview?.rating ?? rating);
				setComment(updated.myReview?.comment ?? "");
				setIsEditingReview(false);
			}
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Unable to save feedback");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (loading || !restaurant || isLoadingReviews) {
		return <div className="reviewsPage reviewsPageLoading">Loading feedback...</div>;
	}

	const isDemoContent = data.reviews.length === 0;
	const reviews = data.reviews.length ? [...data.reviews, ...demoReviews] : demoReviews;
	const summary = reviews.reduce(
		(result, review) => {
			result.total += 1;
			result.average += review.rating;
			result.breakdown[5 - review.rating] += 1;
			return result;
		},
		{ average: 0, total: 0, breakdown: [0, 0, 0, 0, 0] },
	);
	summary.average = Number((summary.average / summary.total).toFixed(1));
	const hasMyReview = Boolean(data.myReview);
	const breakdown = summary.breakdown;
	const sortedReviews = [...reviews].sort((a, b) =>
		sortOrder === "highest" ? b.rating - a.rating : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
	const visibleReviews = sortedReviews.filter((review) => ratingFilter === "all" || review.rating === Number(ratingFilter));
	const displayedReviews = showAllReviews ? visibleReviews : visibleReviews.slice(0, 3);
	const hasMoreReviews = visibleReviews.length > 3;

	return (
		<div className="reviewsPage">
			<section className="reviewsIntro">
				<p className="eyebrow">The student experience</p>
				<h1>
					What students are <span>saying</span>
				</h1>
				<p className="introText">A few words from people who have ordered from {restaurantName}.</p>
			</section>

			<section className={`ratingPanel${summary.total ? "" : " isEmpty"}`} aria-label="Overall rating">
				<div className="ratingScore">
					<strong>{summary.total ? summary.average.toFixed(1) : "—"}</strong>
					<div className="stars" role="img" aria-label={`${summary.average} out of 5 stars`}>
						{summary.total ? "★★★★★" : "☆☆☆☆☆"}
					</div>
					<span>{isDemoContent ? "Student feedback" : `Based on ${summary.total} review${summary.total === 1 ? "" : "s"}`}</span>
				</div>
				<div className={`ratingBreakdown${summary.total ? "" : " isEmpty"}`}>
					{breakdown.map((count, index) => {
						const stars = 5 - index;
						const width = summary.total ? `${(count / summary.total) * 100}%` : "0%";
						return (
							<div className="ratingRow" key={stars}>
								<span>{stars} ★</span>
								<div className="ratingTrack">
									<span style={{ width }} />
								</div>
								<small>{count}</small>
							</div>
						);
					})}
				</div>
			</section>

			{isCustomer && (
				<section className="yourReviewBanner">
					<div>
						<p className="eyebrow">Your contribution</p>
						<h2>{hasMyReview ? "Your review is live." : "Your experience matters."}</h2>
						<p>{hasMyReview ? "You can update your rating or comment at any time." : "Share what you enjoyed and help us make the canteen better."}</p>
					</div>
					<button type="button" onClick={openReviewForm}>
						{hasMyReview ? "Edit your review" : "Write a review"} <span>↘</span>
					</button>
				</section>
			)}

			<section className="feedbackSection">
				<div className="sectionHeading">
					<p className="eyebrow">{isDemoContent ? "Student feedback" : "Recent feedback"}</p>
					<h2>
						Shared by the <span>campus</span>
					</h2>
					{reviews.length > 1 && (
						<div className="reviewControls">
							<label className="sortReviews">
								Sort by
								<select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as "recent" | "highest")}>
									<option value="recent">Most recent</option>
									<option value="highest">Highest rated</option>
								</select>
							</label>
							<label className="sortReviews">
								Show
								<select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value as "all" | "1" | "2" | "3" | "4" | "5")}>
									<option value="all">All ratings</option>
									<option value="5">5 stars</option>
									<option value="4">4 stars</option>
									<option value="3">3 stars</option>
									<option value="2">2 stars</option>
									<option value="1">1 star</option>
								</select>
							</label>
						</div>
					)}
				</div>
				{displayedReviews.length ? (
					<div className="feedbackGrid">
						{displayedReviews.map((item) => {
							const name = item.customer?.fname ?? "Campus student";
							const isMyReview = item._id === data.myReview?._id;
							return (
								<article className="feedbackCard" key={item._id}>
									<div className="feedbackTopline">
										<div className="avatar">{name.charAt(0)}</div>
										<div>
											<h3>
												{name}
												{isMyReview && <span className="reviewBadge">Your review</span>}
											</h3>
											<span>{formatReviewDate(item.createdAt)}</span>
										</div>
										<div className="cardStars" role="img" aria-label={`${item.rating} out of 5 stars`}>
											{"★".repeat(item.rating)}
										</div>
									</div>
									<p>“{item.comment}”</p>
								</article>
							);
						})}
					</div>
				) : (
					<div className="emptyFeedback">
						{reviews.length
							? "No reviews match this filter. Try showing all ratings."
							: "No feedback has been shared yet. Be the first to tell us about your experience."}
					</div>
				)}
				{hasMoreReviews && (
					<button type="button" className="reviewToggle" onClick={() => setShowAllReviews((current) => !current)}>
						{showAllReviews ? "Show fewer reviews" : `See all ${visibleReviews.length} reviews`}
						<span>{showAllReviews ? "↑" : "↓"}</span>
					</button>
				)}
			</section>

			<section className="feedbackCta">
				{isCustomer ? (
					hasMyReview && !isEditingReview ? (
						<div className="submittedReview">
							<div>
								<p className="eyebrow">Your review</p>
								<h2>
									Your feedback is <span>live.</span>
								</h2>
								<p>Thanks for helping fellow students choose their next canteen order.</p>
							</div>
							<div className="submittedReviewQuote">
								<div className="cardStars" role="img" aria-label={`${data.myReview?.rating} out of 5 stars`}>
									{"★".repeat(data.myReview?.rating ?? 0)}
								</div>
								<p>“{data.myReview?.comment}”</p>
							</div>
							<button type="button" onClick={openReviewForm}>
								Edit review <span>↗</span>
							</button>
						</div>
					) : (
						<form className="feedbackForm" onSubmit={submitFeedback}>
							<div>
								<p className="eyebrow">Have something to share?</p>
								<h2>
									{hasMyReview ? "Update your " : "Tell us about your "}
									<span>{hasMyReview ? "review." : "visit."}</span>
								</h2>
							</div>
							<fieldset>
								<legend>Rating</legend>
								<div className="starPicker">
									{[1, 2, 3, 4, 5].map((value) => (
										<button
											key={value}
											type="button"
											className={value <= rating ? "isSelected" : ""}
											aria-label={`${value} star${value === 1 ? "" : "s"}`}
											aria-pressed={value <= rating}
											onClick={() => setRating(value)}>
											★
										</button>
									))}
								</div>
							</fieldset>
							<label htmlFor="feedback-comment">
								Your feedback
								<div className="textareaWrap">
									<textarea
										id="feedback-comment"
										value={comment}
										onChange={(event) => setComment(event.target.value)}
										maxLength={500}
										minLength={3}
										required
										placeholder="What did you enjoy?"
									/>
									<small>{comment.length}/500</small>
								</div>
							</label>
							<div className="feedbackActions">
								<button type="submit" disabled={isSubmitting}>
									{isSubmitting ? "Saving..." : "Save feedback"} <span>↗</span>
								</button>
								{hasMyReview && (
									<button type="button" className="cancelReview" onClick={() => setIsEditingReview(false)}>
										Cancel
									</button>
								)}
							</div>
						</form>
					)
				) : (
					<>
						<div>
							<p className="eyebrow">Have something to share?</p>
							<h2>
								Your feedback helps us <span>improve.</span>
							</h2>
							<p>Log in as a customer to share what worked well and what would make your next visit better.</p>
						</div>
						<button type="button" onClick={openMenuLogin}>
							Open menu to sign in <span>↗</span>
						</button>
					</>
				)}
				{message && <output className="feedbackMessage">{message}</output>}
			</section>
		</div>
	);
};

export default ReviewsPage;
