import mongoose, { Schema, type Document, type Model } from "mongoose";

export type ModuleType = "tat" | "wat" | "srt" | "lecturette" | "gd";
export type SetClassification = "Complete Set" | "Partial Set";

export interface ISetFile {
  key: string;
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

export interface ISet extends Document {
  module: ModuleType;
  name: string;
  files: ISetFile[];
  itemCount: number;
  maxItems?: number;
  isComplete?: boolean;
  setType?: SetClassification;
  createdAt: Date;
  updatedAt: Date;
}

const SetSchema = new Schema<ISet>(
  {
    module: {
      type: String,
      required: true,
      enum: ["tat", "wat", "srt", "lecturette", "gd"],
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    files: [
      {
        key: { type: String, required: true },
        url: { type: String, required: true },
        name: { type: String },
        size: { type: Number },
        mimeType: { type: String },
      },
    ],
    itemCount: {
      type: Number,
      required: true,
      min: 1,
    },
    maxItems: {
      type: Number,
    },
    isComplete: {
      type: Boolean,
    },
    setType: {
      type: String,
      enum: ["Complete Set", "Partial Set"],
    },
  },
  {
    timestamps: true,
  },
);

SetSchema.index({ module: 1, createdAt: -1 });

export const SetModel: Model<ISet> =
  mongoose.models.Set || mongoose.model<ISet>("Set", SetSchema);
