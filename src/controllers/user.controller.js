import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js" // from mongoose 
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const generateAccessAndRefreshTokens= async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        
        return{accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"something went wrong while generating access and refresh token")
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


    const {email,username,password} = req.body//1st step


    if(!username || !email){                       //2nd step
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


    const { accessToken,refreshToken }=await //5th step
    generateAccessAndRefreshTokens(user._id)

    
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




export {
    registerUser,
    loginUser
}