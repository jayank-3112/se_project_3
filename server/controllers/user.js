import { TryCatch } from '../middlewares/error.js';
import { User } from '../models/user.js';
import { cookieOptions, sendToken } from '../utils/features.js';
import { compare } from "bcrypt";
import { ErrorHandler } from '../utils/utility.js';
import { emitEvent } from '../utils/features.js';
import { Chat } from '../models/chat.js';
import { Request } from '../models/request.js';
import { NEW_REQUEST, REFETCH_CHATS } from '../constants/events.js';
//create a new user and save to to the database and 
//save token in cookie 
const newUser = async (req, res) => {
    
    const {name,username,password,bio} = req.body;

    const avatar = {
        public_id: "jmg",
        url: "jmg",
    }

    const user = await User.create({
        name: name,
        username: username,
        password: password,
        bio: bio,
        avatar: avatar,
    });
    sendToken(res, user, 201, "User Created" );
    //res.status(201).json({message : "user created successfully"})
}

//login user and save token in cookie
const login = TryCatch(
    async (req, res, next) => {
    
        try {
        const { username, password} = req.body;
        const user = await User.findOne({username})
        .select("+password");
        if(!user) {
         return next( new ErrorHandler(404,"Invalid username or Password"));
         // return res.status(400).json({message: "Invalid Credentials"});
        }
        const isMatch = await compare(password, user.password);
        if(!isMatch) {
         return next( new ErrorHandler(404,"Invalid username or password"));
         // return res.status(400).json({message: "Invalid Credentials"});
        }
        sendToken(res, user, 200, `Welcome Back,${user.name}` );
        } catch (error) {
         next(error);
        }
        // res.send("Hello World");
     }
);

const getMyProfile = TryCatch( async (req,res) => {
    //return await User.find

    const user = await User.findById(req.user).select("+password");

    res.status(200).json({
        success: true,
        user,
    });
}); 
const logout = TryCatch( async (req,res) => {
    //reset the cookie 

    res.status(200).cookie("app-token","",{...cookieOptions, maxAge: 0}).json({
        success: true,
        message: "Logged out successfully",
    });
}); 

const searchUser = TryCatch( async (req,res) => {
    //query to search the user
    //those users which are not in my connect
    const {name =""} = req.query;

    //FINDING ALL MY CHATS
    const myChats = await Chat.find({
        groupChat:false,
        members: req.user,
    })
    //extracting all users from my chat
    //all users from my chats means freinds or people i have chatted with
    const allUsersFromMyChats = myChats.flatMap((chat) => chat.members);

    const allUsersExceptMeAndFriends = await User.find({
        _id: { $nin: allUsersFromMyChats },
        name: { $regex: name, $options: "i" },
    });
    //modifying the response
    const users = allUsersExceptMeAndFriends.map(({_id,name,avatar}) => ({
        _id,
        name,
        avatar:avatar.url, 
    }));
    return res.status(200).json({
        success: true,
        message: name,
        users,
    })
    // res.status(200)
    // .cookie("app-token","",{...cookieOptions, maxAge: 0}).json({
    //     success: true,
    //     message: name,
    // });
}); 

const sendFriendRequest = TryCatch( async (req, res, next) => {
    const {userId} = req.body;
    const request = await Request.findOne({
        $or: [
            { sender:req.user, receiver:userId },
            { sender:userId, receiver:req.user },
        ],
    });
    if(request)
        return next(new ErrorHandler(400,"Request already sent"));

    await Request.create({
        sender: req.user,
        receiver: userId,
    });

    emitEvent(req,NEW_REQUEST, [userId] );

    return res.status(200).json({
        success: true,
        message: "Friend request sent successfully",
    })

})

const acceptFriendRequest = TryCatch( async (req, res, next) => {
    const {requestId,accept} = req.body;
    const request = await Request.findById(requestId)
    .populate("sender","name")
    .populate("receiver","name")
    if(!request)
        return next(new ErrorHandler(404,"Request not found"));

    if(request.receiver.toString() !== req.user.toString())
        return next(new ErrorHandler(403,"You are not allowed to accept this request"));

    if(!accept) {
        await request.deleteOne();
        return res.status(200).json({
            success: true,
            message: "Friend request rejected successfully",
        })
    }

    const members = [request.sender._id, request.receiver._id ];

    await Promise.all([
        Chat.create({
            members,
            name: `${request.sender.name}-${request.receiver.name}`,
        }),
        request.deleteOne(),
    ])

    emitEvent(req,REFETCH_CHATS,members);
    return res.status(200).json({
        success: true,
        message: "Friend request accepted successfully",
        sender: request.sender._id,
    })

})

const getMyNotifications = TryCatch( async (req,res)=>{
    const request = await Request.find({receiver: req.user})
    .populate(
    "sender",
    "name avatar"    
    );
    // console.log(request)
    const allRequests = request.map(({_id,sender}) => ({
        _id,sender:{
            _id:sender._id,
            name: sender.name,
            avatar: sender.avatar.url
        },
    }));
    return res.status(200).json({
        success: true,
        allRequests,
    })
})
export { login, newUser, getMyProfile,
    logout, searchUser,sendFriendRequest,
    acceptFriendRequest,getMyNotifications,  
};