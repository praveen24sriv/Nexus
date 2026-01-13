# Nexus - Video Hosting Backend

> A production-grade backend architecture for a video hosting platform similar to YouTube.

**Nexus** is a robust RESTful API built with **Node.js**, **Express.js**, and **MongoDB**. It features a complex database schema, secure authentication using JWT (Access & Refresh tokens), and advanced aggregation pipelines for analytics. This project focuses on scalability, code maintainability, and industry-standard practices.

---

## ⚙️ Tech Stack

* **Runtime Environment:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB
* **ORM:** Mongoose
* **Authentication:** JWT (JSON Web Tokens), Bcrypt, Cookie-Parser
* **File Storage:** Cloudinary (with Multer middleware)
* **Tools:** Postman (API Testing), Prettier, Eslint

---

##  Key Features

### 🔐 Authentication & Security
* **JWT Authentication:** Implemented a secure dual-token system (Access Token & Refresh Token) to maintain user sessions without compromising security.
* **Password Hashing:** Utilized `bcrypt` to hash passwords before storing them in the database.
* **Protected Routes:** Custom middleware to verify JWTs and inject user context into request objects.
* **Secure Cookies:** Tokens are stored in HTTP-Only cookies to prevent XSS attacks.

###  Video Management
* **Video Uploads:** Integrated **Multer** and **Cloudinary** for uploading video files and thumbnails.
* **Video CRUD:** Full Create, Read, Update, Delete operations for videos.
* **Publish/Unpublish:** Toggle video visibility status.

###  Advanced Aggregation Pipelines
* **User Dashboard:** Computes channel statistics (Total Views, Total Subscribers, Total Videos, Total Likes) using MongoDB aggregation stages (`$match`, `$lookup`, `$project`, `$addFields`).
* **Watch History:** Complex aggregation to fetch user history with joined video details.

###  Social Interactions
* **Comments:** Add, update, and delete comments on videos.
* **Likes:** Toggle like status on videos, comments, and tweets.
* **Subscriptions:** Manage channel subscriptions and subscriber lists.
* **Playlists:** Create and manage playlists, adding/removing videos dynamically.
* **Tweets:** A community tab feature for text-based posts.

---

## 🛠️ Data Modeling

The database schema is designed with **Mongoose** to handle complex relationships:
* **Users:** Stores credentials, watch history, and profile data.
* **Videos:** Stores metadata, file URLs (Cloudinary), and ownership.
* **Subscriptions:** Handles the Many-to-Many relationship between subscribers and channels.
* **Playlists:** Links videos to custom user collections.
* **Likes/Comments:** Polymorphic relationships to handle interactions across different content types.

---

## 📂 Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file:

```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=*
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
