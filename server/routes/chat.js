import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { searchUser } from "../controllers/user.js";
import { errorMiddleware } from "../middlewares/error.js";

import { addMembers, deleteChat, getChatDetails, getMyChats, getMyGroups, leaveGroup,
     newGroupChat, removeMember, renameGroup, sendAttachments
    , getMessages } from "../controllers/chat.js";
import { attachmentsMulter } from "../middlewares/multer.js";
import { addMemberValidator, getChatIdValidator, leaveGroupValidator, loginValidator, removeMemberValidator, renameValidator, sendAttachmentsValidator, validateHandler } from "../lib/validators.js";
import { newGroupValidator } from "../lib/validators.js";
const app = express.Router();

app.use(isAuthenticated);
// after here user must be logged in to access the route

app.post('/new',newGroupValidator(), validateHandler, newGroupChat);
app.get('/my',getMyChats);           //fetch logged in user chat
app.get('/my/groups',getMyGroups);           //fetch logged in user chat
app.put('/addmembers',addMemberValidator(), validateHandler,  addMembers);           //fetch logged in user chat
app.put('/removemember', removeMemberValidator(), validateHandler, removeMember);           //fetch logged in user chat

//dynamic routing
app.delete("/leave/:id", getChatIdValidator(), validateHandler, leaveGroup);
app.post("/message", attachmentsMulter, sendAttachmentsValidator(), validateHandler, sendAttachments);

//left

//send attachments
//get messages

//get chat details,rename,delete

app.route("/:id").get( getChatIdValidator(), validateHandler,getChatDetails)
.put(renameValidator(), validateHandler,renameGroup)
.delete(getChatIdValidator(),validateHandler, deleteChat);

app.get("/message/:id", getChatIdValidator(), validateHandler, getMessages)

export default app;