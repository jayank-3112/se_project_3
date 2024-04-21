import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { searchUser } from "../controllers/user.js";
import { errorMiddleware } from "../middlewares/error.js";

import { addMembers, getMyChats, getMyGroups, leaveGroup,
     newGroupChat, removeMember, sendAttachments } from "../controllers/chat.js";
import { attachmentsMulter } from "../middlewares/multer.js";
const app = express.Router();

app.use(isAuthenticated);
// after here user must be logged in to access the route

app.post('/new',newGroupChat);
app.get('/my',getMyChats);           //fetch logged in user chat
app.get('/my/groups',getMyGroups);           //fetch logged in user chat
app.put('/addmembers',addMembers);           //fetch logged in user chat
app.put('/removemember',removeMember);           //fetch logged in user chat

//dynamic routing
app.delete("/leave/:id", leaveGroup);
app.post("/message", attachmentsMulter, sendAttachments);

//left

//send attachments
//get messages

//get chat details,rename,delete


//app.get('/search', searchUser);
// app.get("/me", isAuthenticated, getMyProfile);


export default app;