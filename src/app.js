import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({ origin:process.env.CORS_ORIGIN ,credentials:true}));//for cross origin requests
app.use(express.json({limit: '16kb'}));// for json requests
app.use(express.urlencoded({ extended: true,limit: '16kb'}));// for url requests
app.use(express.static('public')); // for static files
app.use(cookieParser()); // for parsing cookies

//routes import
import userRouter from './routes/user.routes.js'

//routes declaration
app.use("/api/v1/users",userRouter); //users is prefix


export default app;
