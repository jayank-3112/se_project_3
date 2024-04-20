import { TryCatch } from '../middlewares/error.js';
import { User } from '../models/user.js';
import { cookieOptions, sendToken } from '../utils/features.js';
import { compare } from "bcrypt";
import { ErrorHandler } from '../utils/utility.js';
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

export { login, newUser, getMyProfile, logout };