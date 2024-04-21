import mongoose from "mongoose";

import jwt from "jsonwebtoken";
import dotenv from "dotenv";

const connectDB = (uri) => {
    mongoose
    .connect(uri,{dbName:"se_project_3"})
    .then((data) => console.log(`Connected to DB :${data.connection.host}`))
    .catch((err) => {
        throw err;
    });
};

const cookieOptions = {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: "none",
    httpOnly: true,
    secure: true,
}

const sendToken =(res, user, code, message) => {
    const token = jwt.sign(
        {
            _id: user._id,
        },
        // process.env.JWT_SECRET,
        "SECRET_TOKEN"
    );
    //console.log(token)
    return res
    .status(code)
    .cookie("app-token",token,
    cookieOptions).json({
        success: true,
        user,
        message,   
    });
};



const emitEvent = (req,event, users, data) => {
    console.log("emitting event",event);

}
//sendToken("response",{_id:"karun"},201,"User Created Successfully")

export { connectDB, sendToken, cookieOptions, emitEvent };