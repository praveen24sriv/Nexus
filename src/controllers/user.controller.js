import {asyncHandler} from "../utils/asyncHandler.js"


const registerUser = asyncHandler( async (req, res)=>{
    //get user details from frontend
    //validation
    //check if user already exists
    //check for file , images , avatar
    //upload it to cloudinary
    //create user object - create entry in DB
    //remove password and refreshtoken from response
    //check for user creation
    //return response
})

export {registerUser}