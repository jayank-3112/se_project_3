import mongoose from "mongoose";
const { Schema, model,Types, models } = mongoose;

const schema = new Schema({
    
    content: String,

    attachments:[
        {
            public_id:{
                type: String,
                required: true, 
            },
            url: {
                type: String,
                required: true,
            },
        }
    ],
    sender: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
    },
    chat: {
        type: Types.ObjectId,
        ref: "Chat",
        required: true,
    },
    members:[{
        type: Types.ObjectId,
        ref: "User",
    }],
},{ timestamps: true,}
);

export const Message = models.Message || model("Message", schema);