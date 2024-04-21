import mongoose from "mongoose";
const { Schema, Types, model, models } = mongoose; // corrected import

// import { User } from "./user.js";

const schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    groupChat: {
        type: Boolean,
        default: false,
    },
    creator: {
        type: Types.ObjectId,
        ref: "User",
    },
    members: [{
        type: Types.ObjectId,
        ref: "User",
    }],
}, { timestamps: true });

export const Chat = models.Chat || model("Chat", schema); // corrected models object
