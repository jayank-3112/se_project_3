import express from "express";
import userRoute from './routes/user.js';
import { connect } from "mongoose";
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";

import dotenv from "dotenv";

dotenv.config({
    path:"./.env",
});

//to be placed after the above function

const mongoURI = process.env.MONGO_URI;
const port = process.env.PORT || 3000;
connectDB(mongoURI);

const app = express();

// using middlewares to get the req.body


app.use(express.json());            // to access the JSON data
app.use(express.urlencoded());      // to access the form data

app.use(cookieParser());           // to access the cookies
// we need to use MULTER to access the multi part data


app.use('/user', userRoute);

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