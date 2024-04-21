import mongoose from "mongoose";
const { Schema, model, Types, models } = mongoose;

const schema = new Schema({
    
    status:{
        type: String,
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

export const Request = models.Request || model("Request", schema);