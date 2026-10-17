import mongoose, { type HydratedDocument } from "mongoose";

const FeedbackSchema = new mongoose.Schema<TFeedback>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true, index: true },
		customer: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true },
		rating: { type: Number, min: 1, max: 5, required: true },
		comment: { type: String, trim: true, minlength: 3, maxlength: 500, required: true },
	},
	{ timestamps: true },
);

FeedbackSchema.index({ restaurantID: 1, customer: 1 }, { unique: true });

export const Feedbacks = mongoose.models?.feedbacks ?? mongoose.model<TFeedback>("feedbacks", FeedbackSchema);
export type TFeedback = HydratedDocument<{
	restaurantID: string;
	customer: mongoose.Types.ObjectId;
	rating: number;
	comment: string;
}>;
