import {Router} from "express";
import {registerUser} from "../controllers/user.controller.js"

const router = Router()
router.route("/register").post(registerUser) // so route will be https://localhost:8000/api/v1/users/register


export default router
