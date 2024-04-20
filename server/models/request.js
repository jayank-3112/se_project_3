import mongoose from "mongoose";
const { Schema, model, models } = "mongoose";

const schema = new Schema({
    
    status:{
        Type: String,
        default: "pending",
        enum:["pending", "accepted", "rejected"],
    },
    sender: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiver: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
    },
},{ timestamps: true,}
);

export const Request = models.Request || models("Request", schema);