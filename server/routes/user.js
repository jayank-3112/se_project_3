import express from "express";
import { login, newUser,getMyProfile, logout , searchUser} from "../controllers/user.js";
import { singleAvatar } from "../middlewares/multer.js";
import { errorMiddleware } from "../middlewares/error.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { loginValidator, registerValidator, validateHandler } from "../lib/validators.js";


const app = express.Router();

//http://localhost:3000/user/login
app.post('/new',singleAvatar, registerValidator(),
validateHandler, newUser);
app.post('/login', loginValidator(), validateHandler, login)


// after here user must be logged in to access the route
app.use(isAuthenticated);
app.get("/me", getMyProfile);
app.get("/logout",logout);

app.get('/search', searchUser);
// app.get("/me", isAuthenticated, getMyProfile);


export default app;