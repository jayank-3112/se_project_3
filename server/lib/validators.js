
import { body, param, validationResult, check, query } from "express-validator";
import { ErrorHandler } from "../utils/utility.js";

const validateHandler = (req,res,next) => {
    const errors = validationResult(req);

    const errorMesssages = errors.array()
    .map((error) => error.msg)
    .join(",");
    console.log(errorMesssages);
    if(errors.isEmpty())
        return next();
    else
        next(new ErrorHandler(400,errorMesssages));
};
const registerValidator = () => [
    body("name","Please enter the name ").notEmpty(),
    body("username","Please enter the username").notEmpty(),
    body("password","Please enter the password ").notEmpty(),
    body("bio","Please enter the bio ").notEmpty(),
    check("avatar","Please upload avatar").notEmpty(),
];

const loginValidator = () => [
    body("username","Please enter the username").notEmpty(),
    body("password","Please enter the password ").notEmpty(),
];

const newGroupValidator = () => [
    body("name", "Please enter the name").notEmpty(),
    body("members", "Please enter members ")
        .notEmpty().withMessage("Please enter members")
        .isArray({ min: 2, max: 100 }).withMessage("Members must be between 2 and 100"),
];

const addMemberValidator = () => [
    body("chatId", "Please enter the ChatId").notEmpty(),
    body("members", "Please enter members ")
        .notEmpty().withMessage("Please enter members")
        .isArray({ min: 1, max: 97 }).withMessage("Members must be between 1 and 97"),
];

const removeMemberValidator = () => [
  body("chatId", "Please enter the ChatId").notEmpty(),
  body("removeId", "Please enter the UserId").notEmpty(),    
];

const leaveGroupValidator = () => [
  param("id", "Please enter the ChatId").notEmpty(),
];

const sendAttachmentsValidator = () => [
    body("chatId", "Please enter the ChatId").notEmpty(),
    check("files").notEmpty()
    .notEmpty()
    .withMessage("Please upload attachments")
    .isArray({ min: 1, max: 5 })
    .withMessage("Attachments must be between 1 to 5"),
];

const getChatIdValidator = () => [
    param("id", "Please enter the ChatId").notEmpty(),
];

const renameValidator = () => [
    param("id", "Please enter the ChatId").notEmpty(),
    body("name", "Please enter the name").notEmpty(),
];
const sendRequestValidator = () => [
    body("userId", "Please enter user ID").notEmpty(),
];
const acceptRequestValidator = () => [
    body("requestId", "Please enter the request ID").notEmpty(),
    body("accept")
    .notEmpty()
    .withMessage("pleasse add accept")
    .isBoolean()
    .withMessage("Accept must be a boolean"),
];
export {registerValidator, validateHandler, 
    loginValidator, removeMemberValidator,
    addMemberValidator,leaveGroupValidator, 
    newGroupValidator, sendAttachmentsValidator,
    getChatIdValidator, 
    renameValidator, sendRequestValidator,
    acceptRequestValidator,
};