import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // we can also give every file a unique suffix (not required here)
  }
})

export const upload = multer({
         storage, 
})