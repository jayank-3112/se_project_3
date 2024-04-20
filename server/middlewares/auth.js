import { ErrorHandler } from "../utils/utility.js";
import { TryCatch } from "./error.js";
import jwt from "jsonwebtoken";
const isAuthenticated = (req,res,next)=>{
    
    const token = req.cookies["app-token"];
    //console.log("cookie:",token);
    if(!token)
        return next(new ErrorHandler(401,"Please login to access this route"));

    const decodedData = jwt.verify(token,"SECRET_TOKEN");
    // const decodedData = jwt.verify(token,process.env.JWT_SECRET)
    console.log("decoded data:",decodedData);
    req.user = decodedData._id;             // id of user
    next();
};

export { isAuthenticated };