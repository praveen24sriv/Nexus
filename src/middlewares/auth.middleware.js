import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"



export const verifyJWT =asyncHandler(async(req ,res,next)=>{ //req and res both have cookie and we used cookie parser
try {
        const token= req.cookies?.accessToken || req.header
        ("Authorization")?.replace("Bearer","") // as Authorization has "Bearer_________"
    
    
        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
        
        const decodedToken = jwt.verify(token,process.env
            .ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            // pending 
            throw new ApiError(401,"Invalid access")
        }
    
        req.praveen=user // adding an object named praveen in req and giving it all data
        next()
} catch (error) {
    throw new ApiError(401,error?.message || "Invalid access token")
}
})
      
 