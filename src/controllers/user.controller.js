import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js" // from mongoose 
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import { decode } from "punycode"


const generateAccessAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

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


    const existedUSer =await User.findOne({
        $or:[{ username },{ email }] //or function to check both (3rd step)
    })
    if(existedUSer){ throw new ApiError(409,"Email or username already exists")}

    
    const avatarLocalPath= req.files?.avatar[0]?.path;
    //const coverImageLocalPath= req.files?.coverImage[0]?.path; // 4th step
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
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

const loginUser = asyncHandler( async (req,res)=>{

    /* 1)req body - > data
       2)username or email
       3)find the user 
       4)password
       5)access and refresh token
       6)send cookie.  */


    const {username, email, password} = req.body //1st step


    if(!(username || email)){                       //2nd step
        throw new ApiError(400,"username or email is required")
    }

    const user = await User.findOne({
        $or:[{username},{email}]//3rd step
    })
    if(!user){
        throw new ApiError(404,"User does not exist")
    }


    const isPasswordValid= await user.isPasswordCorrect(password) //4th step
     if(!isPasswordValid){
        throw new ApiError(401,"Password is not correct")
    }


    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    //5th step

    
    const loggedInUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    const options ={  //option->object
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options) //6th step
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,{
                user:loggedInUser,accessToken,refreshToken //again sending in case user
                                                        // wants to save access and refresh token
            },
            "User logged in successfully"   
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.praveen._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

   return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler ( async (req,res)=>{
    const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized access")
    }

try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(incomingRefreshToken!== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
        const {accessToken,newRefreshToken } =await generateAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access Token Refreshed"
            )
        )
} catch (error) {
    throw new ApiError(401,error?.message || "Invalid Refresh Token")   
}
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
     const {oldPassword , newPassword}= req.body

     const user = await User.findById(req.praveen?._id)

     const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)
     if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid Old Password")
     }

     user.password= newPassword
     await user.save({validateBeforeSave:false})
    
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(200,req.praveen,"current user fetched successfully")
    
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email} =req.body
    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.praveen?._id,
        {
            $set : {
                fullName:fullName, //1
                email // 2 both ways are allowed
            }
        },{new:true}
    ).select("-password")

    return res
    .status(200)
    .json( new ApiResponse(200, user ,"Account details changed"))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath= req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
         throw new ApiError(400,"error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.praveen?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")
     
    return res
    .status(200)
    .json( new ApiResponse(200,user,"avatar updated successfully"))
   
   
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath= req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"cover image file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
         throw new ApiError(400,"error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.praveen?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

     return res
    .status(200)
    .json( new ApiResponse(200,user,"cover image updated successfully"))
})

const getUserChannelProfile= asyncHandler(async(req,res)=>{
    const {username} = req.params
    if(!username?.trim()){
        throw new ApiError(400,"username not found")
    }
    //User.find({username}) //can do 

    const channel= await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase() //1st pipleine
            }
        },
        {
            $lookup:{
                from:"subscriptions",    //as Subscription --> subscriptions in db
                localField: "_id",
                foreignField:"channel",   //2nd pipeline
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",    //as Subscription --> subscriptions in db
                localField: "_id",
                foreignField:"subscriber",   //2nd pipeline
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed :{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{ //project only selected things (which are set to 1)
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
        
    ])

    if(!channel?.length){
        throw new ApiError(404,"Channel not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        channel[0],
        "User channel fetched successfully"
    ))

})

const getWatchHistory = asyncHandler(async(req,res)=>{

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}