import express from "express";
import { login, newUser,getMyProfile, logout } from "../controllers/user.js";
import { singleAvatar } from "../middlewares/multer.js";
import { errorMiddleware } from "../middlewares/error.js";
import { isAuthenticated } from "../middlewares/auth.js";


const app = express.Router();

//http://localhost:3000/user/login
app.post('/new', singleAvatar, newUser);
app.post('/login', login)


// after here user must be logged in to access the route
app.use(isAuthenticated);
app.get("/me", getMyProfile);
app.get("/logout",logout);
// app.get("/me", isAuthenticated, getMyProfile);


export default app;