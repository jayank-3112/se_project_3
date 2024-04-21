import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import { Chat } from "../models/chat.js";
import { deleteFilesFromCloudinary, emitEvent } from "../utils/features.js";
// import newGroupChat from 
import { ALERT, NEW_ATTACHMENT, NEW_MESSAGE_ALERT, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
import { User } from "../models/user.js";
import { Message } from "../models/message.js";

const newGroupChat = TryCatch(async(req,res,next) => {
    const {name, members} = req.body;

    if(members.length<2) 
        return next(
            new ErrorHandler(400,"Group chat must have at least 3 members")
        );

    const allMembers = [...members, req.user];

    await Chat.create({
        name,
        groupChat: true,
        creator: req.user,
        members: allMembers,
    })
    emitEvent(req,ALERT,allMembers,
    `Welcome to ${name} group chat`);
    emitEvent(req,REFETCH_CHATS, members);

    return res.status(201).json({
        success: true,
        message: "Group chat created successfully",
    });
});

const getMyChats = TryCatch(async (req, res, next) => {
    
    const chats = await Chat.find({ members: req.user })
        .populate("members", "name avatar");

    const transformedChats = chats.map(({ _id, name, members, groupChat }) => {
        const otherMember = getOtherMember(members, req.user);
        return {
            _id,
            groupChat,
            avatar: groupChat ? members.slice(0, 3).map(({ avatar }) => avatar.url) 
            : [otherMember.avatar.url],
            name: groupChat ? name : otherMember.name,
            members: members.reduce((prev,curr) => {
            if(curr._id !== req.user._id){
                prev.push(curr._id);
            }
            return prev;
        },[]),
    };
}); // This is where the closing parenthesis for the map function should be

    return res.status(200).json({
        success: true,
        chats: transformedChats,
        message: "User Chats fetched successfully",
    });
});
const getMyGroups = TryCatch(async (req, res, next) => {
    
    const chats = await Chat.find({ 
        members: req.user,
        groupChat: true,
        creator: req.user,
    }).populate("members", "name avatar");

    const transformedGroups = chats.map(({members,
    _id, groupChat,name}) => ({
        _id,
        groupChat,
        avatar: members.slice(0, 3).map(({ avatar }) => avatar.url),
        name,
    }));
    return res.status(200).json({
        success: true,
        groups: transformedGroups,
        message: "User groups fetched successfully",
    });
});

const addMembers = TryCatch(async (req, res, next) => {
    const { chatId, members } = req.body;

    if (!members || members.length < 1)
        return next(
            new ErrorHandler(400, "Please provide some members")
        );
    const chat = await Chat.findById(chatId);
    if (!chat)
        return next(new ErrorHandler(404, "Chat not found"));
    if (!chat.groupChat)
        return next(new ErrorHandler(400, "Chat is not a group chat"));

    if (chat.creator.toString() !== req.user.toString())
        return next(new ErrorHandler(403, "User is not allowed to add members"));

    const allNewMembersPromise = members.map(i => User.findById(i, "name"));
    const allNewMembers = await Promise.all(allNewMembersPromise);

    // Filter out members that are already in the chat
    const uniqueMembers = allNewMembers.filter(i => !chat.members.includes(i._id.toString()));

    // Check if adding new members would exceed the group's member limit
    if (chat.members.length + uniqueMembers.length > 100)
        return next(new ErrorHandler(400, "Group members limit reached"));

    // Push only unique members to the chat's members array
    chat.members.push(...uniqueMembers.map(i => i._id));

    await chat.save();

    const allUsersName = uniqueMembers.map(i => i.name).join(",");

    emitEvent(
        req,
        ALERT,
        chat.members,
        `${allUsersName} have been added to the group`
    );
    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
        success: true,
        message: "Members added successfully",
        members: uniqueMembers.map(i => i.name),
    });
});

const removeMember = TryCatch(async (req, res, next) => {
    const {userId, chatId} = req.body;
    const [chat, userThatWillBeRemove] = await Promise.all(
        [Chat.findById(chatId),
         User.findById(userId,"name"),
        ]);

    if (!chat)
        return next(new ErrorHandler(404, "Chat not found"));
    if (!chat.groupChat)
        return next(new ErrorHandler(400, "Chat is not a group chat"));

    if (chat.creator.toString() !== req.user.toString())
        return next(new ErrorHandler(403, "User is not allowed to remove members"));
    
    if(chat.members.length <= 3) 
        return next(
            new ErrorHandler(400, "Group chat must have at least 3 members")
        );

    chat.members = chat.members.filter(
        (member) => member.toString() !== userId.toString())

    await chat.save();

    emitEvent(
        req,
        ALERT,
        chat.members,
        `${userThatWillBeRemove.name} has been removed from the group`
    )
    emitEvent(req, REFETCH_CHATS, chat.members);
    return res.status(200).json({
        success: true,
        message: "Members removed successfully",
        // members: chat.members.map((i) => i.name),
    });
});

const leaveGroup = TryCatch(async (req,res,next) => {
    const chatId = req.params.id;
    const chat = await Chat.findById(chatId);

    if (!chat)
        return next(new ErrorHandler(404, "Chat not found"));
    if (!chat.groupChat)
        return next(new ErrorHandler(400, "Chat is not a group chat"));

    if(chat.members.length <= 3) 
        return next(
            new ErrorHandler(400, "Group chat must have at least 3 members")
        );
    
    chat.members = chat.members.filter(
        (member) => member.toString() !== req.user.toString()
    )

    const remainingMembers = chat.members.filter(
        (member) => member.toString() !== req.user.toString()
    );
    //if admin leaves re-assign the admin
    if(chat.creator.toString() === req.user.toString()) {
      const randomElement = Math.floor(Math.random() * remainingMembers.length);
        // const newCreator = remainingMembers[0];
        const newCreator = remainingMembers[randomElement];
        chat.creator = newCreator;
    }
    chat.members = remainingMembers;
    const [user] = await Promise.all([User.findById(req.user,
        "name"), chat.save()]);

    emitEvent(
        req,
        ALERT,
        chat.members,
        `${user.name} has left from the group`
    )
    emitEvent(req, REFETCH_CHATS, chat.members);
    return res.status(200).json({
        success: true,
        message: "Members has left the group successfully",
        //members: chat.members.map(i => i.name),
    });

});

const sendAttachments = TryCatch( async (req, res, next) =>{
    const { chatId } = req.body;
    const [chat, me] = await Promise.all([
        Chat.findById(chatId),
        User.findById(req.user," name ")]);

    console.log(chatId,me);

    if(!chat)
        return next(new ErrorHandler(404,"Chat not found"));
    
    //console.log(chat);
    const files = req.files || [];
    if(files.length < 1)
        return next(new ErrorHandler(400, "Please provide some attachments"));

    //upload files here
    const attachments = [];
    const messageForDB = {content: "",
    attachments,
    sender: me._id, 
    chat: chatId};

    const messageForRealTime = {
        ...messageForDB,
        sender:{
            _id: me._id,
            name: me.name,
            // avatar: me.avatar.url,
        },
    };
    const message = await Message.create(messageForDB);
    emitEvent(req, NEW_ATTACHMENT,
    chat.members,{
        message: messageForRealTime,
        chatId,
    });

    emitEvent(req, NEW_MESSAGE_ALERT, chat.members,{
        chatId,
    });
    
    return res.status(200).json({
        success: true,
        message,
    });
});

const getChatDetails = TryCatch(async (req,res,next) => {
    if(req.query.populate === "true") {
        console.log("populate");
        const chat = await Chat.findById(req.params.id).populate(
            "members",
            "name avatar").lean();
        if(!chat) 
            return next(new ErrorHandler(404, "Chat not found"));
        chat.members = chat.members.map(({
            _id,
            name,
            avatar,
        }) => ({
            _id,
            name,
            avatar: avatar.url,
        }));
        return res.status(200).json({
            success: true,
            chat,
        });
    }
    else {
        console.log("no populate");
        const chat = await Chat.findById(req.params.id);
        if(!chat)
            return next(new ErrorHandler(404, "Chat not found"));

        return res.status(200).json({
            success: true,
            chat,
        });
    }
})

const renameGroup = TryCatch ( async(req,res,next) =>{
    const chatId = req.params.id;
    const { name } = req.body;
    const chat = await Chat.findById(chatId);
    if(!chat)
        return next(new ErrorHandler(404,"Chat not found"));

    if(!chat.groupChat)
        return next(new ErrorHandler(400,"This is not a group chat"));

    if(chat.creator.toString()!== req.user.toString())
        return next(new ErrorHandler(403, "You are not allowed to rename this group"));
    
    chat.name= name;
    await chat.save();

    emitEvent(req,REFETCH_CHATS, chat.members);

    return res.status(200).json({
        success: true,
        message: "Group name changed successfully",
    });

} )

const deleteChat = TryCatch( async (req, res, next) => {
    const chatId = req.params.id;
    const chat = await Chat.findById(chatId);
    if(!chat)
        return next(new ErrorHandler(404,"Chat not found"));

    
    const members = chat.members;

    if(chat.groupChat && chat.creator.toString()!== req.user.toString())
        return next(new ErrorHandler(403, "You are not allowed to delete the chat"));

    if(!chat.groupChat && chat.member.includes(req.user.toString()))
        return next(new ErrorHandler(403, "You are not allowed to delete the chat"));    
  
    // here we have to delete all the messages as well
    // as attachments from cloudinary

    const messagesWithAttachments = await Message.find({
        chat: chatId,
        attachments: {
            $exists: true,
            $ne: [],
        },
    })
    const public_ids = [];

    messagesWithAttachments.forEach(({attachments}) =>
        attachments.forEach(({public_id}) => 
            public_ids.push(public_id))
        );

        await Promise.all([
            //delete files from cloudinary
            deleteFilesFromCloudinary(public_ids),
            chat.deleteOne(),
            Message.deleteMany({ chat:chatId}),
        ]);

        emitEvent(req,REFETCH_CHATS, members);
        return res.status(200).json({
            success: true,
            message: "Chat deleted successfully",
        });
});

const getMessages = TryCatch( async(req, res, next) =>{
    const chatId = req.params.id;
    const chat = await Chat.findById(chatId);
    if(!chat)
        return next(new ErrorHandler(404,"Chat not found"));
    const { page = 1 } = req.query; 
    const result_per_page = 20;
    const skip = (page - 1) * result_per_page;
    const [ messages, totalMessagesCount ] = await Promise.all([
        Message.find({chat: chatId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(result_per_page)
    .populate("sender", "name avatar")
    .lean(),
    Message.countDocuments({chat: chatId}),
    ]);

    const totalPages = Math.ceil(totalMessagesCount / result_per_page);
    return res.status(200).json({
        success: true,
        messages: messages.reverse(),
        totalPages,
    });
});
export {newGroupChat, getMyChats, getMyGroups, 
    addMembers, removeMember, 
    leaveGroup, sendAttachments,
    getChatDetails, renameGroup,
    deleteChat, getMessages
};
