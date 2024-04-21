import express from "express";
import { connect } from "mongoose";
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";

import dotenv from "dotenv";

import userRoute from './routes/user.js';
import chatRoute from './routes/chat.js';
import { createUser } from "./seeders/user.js";
import { createSingleChats,createGroupChats, createMessages, createMessagesInAChat, } from "./seeders/chat.js";

dotenv.config({
    path:"./.env",
});

//to be placed after the above function

const mongoURI = process.env.MONGO_URI;
const port = process.env.PORT || 3000;
connectDB(mongoURI);

//fake data to create 10 users
//createUser(10);
//createSingleChats(10);
//createGroupChats(10);
//createMessagesInAChat("6624f2b5fb527e1d9fd37fda",50);
const app = express();

// using middlewares to get the req.body


app.use(express.json());            // to access the JSON data
app.use(express.urlencoded());      // to access the form data

app.use(cookieParser());           // to access the cookies
// we need to use MULTER to access the multi part data


app.use('/user', userRoute);
app.use('/chat', chatRoute);

//home route 
app.get("/",(req,res) => {
    res.send("Hello World")
})

//error middleware
app.use(errorMiddleware)
/* how to create an endpoint
//in contollers
const scsd = (req,res) => {
    res.send("<h1>Hello World</h1>");
}
//in routes
app.get("/",scsd);
*/
app.listen(port,() => {
    console.log(`Server is listening on port ${port}`);
});