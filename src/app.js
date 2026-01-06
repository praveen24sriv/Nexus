import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({ //for cross origin requests
        origin:process.env.CORS_ORIGIN ,
        credentials:true
}));

app.use(express.json({// for json requests
    limit: '16kb'
}));

app.use(express.urlencoded({ // for url requests
    extended: true,
    limit: '16kb'
}));

app.use(express.static('public')); // for static files

app.use(cookieParser()); // for parsing cookies

export default app;
