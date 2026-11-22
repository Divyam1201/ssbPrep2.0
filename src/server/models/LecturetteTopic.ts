import mongoose, { Schema, type Document, type Model } from "mongoose";

export type LecturetteTier = "veasy" | "easy" | "moderate" | "high";

export interface ILecturetteTopic extends Document {
  name: string;
  nameLower: string;
  tier: LecturetteTier;
  createdAt: Date;
}

const LecturetteTopicSchema = new Schema<ILecturetteTopic>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    nameLower: {
      type: String,
      required: true,
      trim: true,
    },
    tier: {
      type: String,
      required: true,
      enum: ["veasy", "easy", "moderate", "high"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  },
);

LecturetteTopicSchema.index({ nameLower: 1 }, { unique: true });

export const LecturetteTopicModel: Model<ILecturetteTopic> =
  mongoose.models.LecturetteTopic ||
  mongoose.model<ILecturetteTopic>("LecturetteTopic", LecturetteTopicSchema);
