import {asyncHandler} from "../utils/asyncHandler.js"


const registerUser = asyncHandler( async (req, res)=>{
    res.status(200).json({
        message :"hora h hora h dhire dhire hora h"
    })
})

export {registerUser}