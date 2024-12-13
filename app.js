const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Student=require("./models/student.js");
const Faculty=require("./models/faculty.js");
const Complaint=require("./models/complaints.js");
const students=require("./routes/student.js");
const facultys=require("./routes/faculty.js");
const representatives=require("./routes/representative.js")
const cloudinary=require('cloudinary');
const formidable=require('formidable');

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const cors = require("cors");
const validateEmailDomain = require("./middleware/validateEmailDomain");

const generateToken = (payload) => jwt.sign(payload, "hi");

// dotenv.config(); // Load environment variables
app.use(express.json());
app.use(cors());


app.use(express.urlencoded({extended:true}));


// const url="mongodb://127.0.0.1:27017/rguktMess";
main()
.then(()=>{
    console.log("Connected to Database");
})
.catch((err)=>{
    console.log(err);
})


async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/rguktMess');
}
  



    

app.get("/",(req,res)=>{
    res.send("hi");
});

app.use("/student",students);
app.use("/faculty",facultys);
app.use("/representative",representatives);

// Set up Cloudinary configuration
cloudinary.config({
  cloud_name: FIRST,
  api_key: SECOND,
  api_secret: THIRD,
});

export const config = {
  api: {
    bodyParser: false, // Disable body parsing so we can handle the file upload manually
  },
};

app.post("./image", async (req, res) => {
    // Parse the form data to handle the file upload
    const form = new formidable.IncomingForm();
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: 'Error parsing the form data' });
      }

      // Ensure the file exists
      const file = files.file[0]; // Assuming the key is 'file' in the form data

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      try {
        // Upload the image to Cloudinary
        const uploadResponse = await cloudinary.v2.uploader.upload(file.filepath, {
          upload_preset: 'First_Time_Using_Cloudinary', // Replace with your preset
        });

        // Return the image URL as a response
        res.status(200).json({ imageUrl: uploadResponse.secure_url });
      } catch (uploadError) {
        res.status(500).json({ error: 'Error uploading the image to Cloudinary' });
      }
    });
});


app.listen(8080,()=>{
    console.log("server is listening to port 8080");
});