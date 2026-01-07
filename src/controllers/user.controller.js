import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const registerUser = asyncHandler( async (req, res)=>{
    /*get user details from frontend
    validation
    check if user already exists
    check for images , check for avatar
    upload it to cloudinary
    create user object - create entry in DB
    remove password and refreshtoken from response
    check for user creation
    return response */


    const {fullName , email , username , password}= req.body // 1st step


    // if(fullName===""){
    //     throw new ApiError(400,"fullname is required") 
    // }
    if(
        [fullName,username,email,password].some((field)=>field?.trim()==="") //2nd step
    ){
       throw new ApiError(400,"All fields are required")
    }


    const existedUSer =User.findOne({
        $or:[{ username },{ email }] //or function to check both (3rd step)
    })
    if(existedUSer){ throw new ApiError(409,"Email or username already exists")}

    
    const avatarLocalPath= req.files?.avatar[0]?.path;
    const coverImageLocalPath= req.files?.coverImage[0]?.path; // 4th step
    if(!avatarLocalPath) {throw new ApiError(400,"Avatar file is required")}

    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)//5th step
    if(!avatar) {throw new ApiError(400,"Avatar file is required")}


    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage :coverImage?.url || "", //checking for coverimage for safety
        email,                             // 6th Step
        password,
        username: username.toLowerCase()
    })


     const createduser = await User.findById(user._id) //8th step p1 ( return true or false)
     .select("-password -refreshToken") // 7th step ( weird syntax but okay )

     if(!createduser){
        throw new ApiError(500,"Something went wrong") //8th step p2
     }

     
     return res.status(201).json(
        new ApiResponse(200,createduser,"User registered successfully")//9th step
     )


})

export {registerUser}