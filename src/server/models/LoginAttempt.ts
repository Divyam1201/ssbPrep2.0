import mongoose, { Schema, type Model } from "mongoose";

export interface ILoginAttempt {
  ip: string;
  createdAt: Date;
}

const LoginAttemptSchema = new Schema<ILoginAttempt>(
  {
    ip: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now, expires: 900 }, // 15 minutes TTL
  },
  { timestamps: false },
);

export const LoginAttemptModel: Model<ILoginAttempt> =
  mongoose.models.LoginAttempt ||
  mongoose.model<ILoginAttempt>("LoginAttempt", LoginAttemptSchema);
