import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subcriber: {
      // one who is subscribing
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    channel: {
      // one to whom subsciber is subscribing
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
