const express = require("express");
const router = express.Router();
const Faculty = require("../models/faculty.js");
const Complaint = require("../models/complaints.js");
const Student = require("../models/student.js");
const authenticate=require("../middleware/authenticate.js");
const dotenv = require("dotenv");
const sendEmail=require("../middleware/sendMail.js");

const generateToken = (payload) => jwt.sign(payload, "hi");


const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const dotenv = require("dotenv");
const validateEmailDomain = require("../middleware/validateEmailDomain");
dotenv.config(); // Load environment variables
// const generateToken = (payload) => jwt.sign(payload, "hi");
const Token = require("../models/token.js");
const crypto=require("crypto");


const validatePosition = (email) => {
  const position = email.split("@")[0];
  const allowedUsernames = ["ao", "dean", "ada", "dsw"];
  return allowedUsernames.includes(position);
};

const validateRequestBody = (requiredFields) => (req, res, next) => {
  const missingFields = requiredFields.filter((field) => !req.body[field]);
  if (missingFields.length) {
    return res.status(400).send({
      isSuccess: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }
  next();
};


router.get("/",authenticate, async (req, res) => {
    try {
        let {id}=req.user.id;//from jwt
        const faculties = await Faculty.findById(id); // Retrieve all faculty records
        res.status(200).json({ isSuccess: true, faculties: faculties });
    } catch (error) {
        res.status(500).json({ isSuccess: false, message: "Failed to retrieve faculties", error: error.message });
    }
});

router.get("/makeRepresentative", async (req, res) => {
    try {
        const eligibleStudent = await Student.find({ isRepresentative: false }); // Faculties not yet representatives
        res.status(200).json({ isSuccess: true, faculties: eligibleFaculties });
    } catch (error) {
        res.status(500).json({ isSuccess: false, message: "Failed to retrieve eligible Students", error: error.message });
    }
});

// GET /faculty/Representative/:id - Retrieve representative faculty by ID
router.get("/Representative/:id", async (req, res) => {
    try {
        const { id } = req.query;;
        const student = await Student.findById(id);
        if (!student || !student.isRepresentative) {
            return res.status(404).json({ isSuccess: false, message: "Representative not found" });
        }
        res.status(200).json({ isSuccess: true,message: "Representative found", student: student });
    } catch (error) {
        res.status(500).json({ isSuccess: false, message: "Failed to retrieve representative", error: error.message });
    }
});

// POST /faculty/makeRepresentative/:id - Assign a faculty member as a representative
router.post("/makeRepresentative/:id", async (req, res) => {
    try {
        const { id } = req.query;
        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({ isSuccess: false, message: "student not found" });
        }
        if (student.isRepresentative) {
            return res.status(400).json({ isSuccess: false, message: "student is already a representative" });
        }
        student.isRepresentative = true;
        await student.save();
        res.status(200).json({ isSuccess: true, message: "student assigned as representative", faculty: faculty });
    } catch (error) {
        res.status(500).json({ isSuccess: false, message: "Failed to assign representative", error: error.message });
    }
});

// GET /faculty/complaint/all - Retrieve all complaints
router.get("/complaint/all", async (req, res) => {
    try {
        const complaints = await Complaint.find(); // Retrieve all complaints
        res.status(200).json({ isSuccess: true, complaints: complaints });
    } catch (error) {
        res.status(500).json({ isSuccess: false, message: "Failed to retrieve complaints", error: error.message });
    }
});

// GET /faculty/complaint/:id - Retrieve a specific complaint by ID
router.get("/complaint/:id", async (req, res) => {
    try {
        const { id } = req.query;
        const complaint = await Complaint.findById(id); // Retrieve complaint by ID
        if (!complaint) {
            return res.status(404).json({ isSuccess: false, message: "Complaint not found" });
        }
        res.status(200).json({ isSuccess: true, complaint: complaint });
    } catch (error) {
        res.status(500).json({ isSuccess: false, message: "Failed to retrieve complaint", error: error.message });
    }
});

// POST /faculty/complaint/:id - Add a comment or action to a specific complaint
router.post("/complaint/:id", async (req, res) => {
    try {
        const { id } = req.query;
        // const {facultyId}=req.params;//jwt
        const { img,comment, status } = req.body;
        if (!status) {
            return res.status(400).json({ isSuccess: false, message: "action is required" });
        }
        const complaint = await Complaint.findById(id);
        if (!complaint) {
            return res.status(404).json({ isSuccess: false, message: "Complaint not found" });
        }
        // Update complaint with comment or action
        if (img) complaint.resolvedImg=img;
        if (comment) complaint.resolvedDescription=comment;
        if (actionTaken) complaint.status = status;
        if(status===resolved) complaint.resolvedDate=new Date();
        await complaint.save();
        res.status(200).json({ isSuccess: true, message: "Complaint updated successfully", complaint: complaint });
    } catch (error) {
        res.status(500).json({ isSuccess: false, message: "Failed to update complaint", error: error.message });
    }
});


router.post(
    "/faculty/register",
    validateEmailDomain,
    validateRequestBody(["email", "password", "userName"]),
    async (req, res) => {
      try {
        const { email, password, userName } = req.body;
  
        if (!validatePosition(email)) {
          return res.status(400).send({
            isSuccess: false,
            message: "Invalid faculty email",
          });
        }
  
        if (await Faculty.findOne({ email })) {
          return res.status(400).send({
            isSuccess: false,
            message: "Faculty email already registered",
          });
        }
  
        if (password.length < 8) {
          return res.status(400).send({
            isSuccess: false,
            message: "Password is too short",
          });
        }
  
        const hashedPassword = await bcrypt.hash(password, 10);
  
        const newFaculty = await Faculty.create({
          email,
          userName,
          password: hashedPassword,
          position: email.split("@")[0],
        });

        const token = await new Token({
          userId: newFaculty._id,
          token:crypto.randomBytes(32).toString("hex"),
    
        });
        await token.save();
        const url= `${process.env.BASE_URL}users/${newFaculty._id}/verify/${token.token}`;
        await sendEmail(newFaculty.email,"Verify Emaill", url);
    
        return res.status(201).send({isSuccess: true, message: "An Email sent to your account, please check your mail " });
  
  
        // return res.status(201).send({
        //   isSuccess: true,
        //   message: "Faculty registration successful",
        // });
      } catch (error) {
        console.error("Error while registering faculty:", error);
        return res.status(500).send({
          isSuccess: false,
          message: "Failed to register faculty",
        });
      }
    }
  );

  router.get("/:id/:token", async (req, res) => {
    try {
        const user = await Faculty.findOne({ _id: req.params.id });
        if (!user) return res.status(400).send({ message: "Invalid link" });

        const token = await Token.findOne({
            userId: user._id,
            token: req.params.token
        });
        if (!token) return res.status(400).send({ message: "Invalid link" });

        await Faculty.updateOne({ _id: user._id }, { verified: true });
        await token.deleteOne(); // Ensure token is deleted after verification

        // console.log("User verified successfully:", user);
        res.status(200).send({ message: "Email verified successfully" });
    } catch (error) {
        console.error("Error verifying email:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

  router.post(
    "/faculty/login",
    validateRequestBody(["email", "password"]),
    async (req, res) => {
      try {
        const { email, password } = req.body;
        const faculty = await Faculty.findOne({ email });
  
        if (!faculty) {
          return res.status(400).send({
            isSuccess: false,
            message: "Invalid faculty email",
          });
        }
  
        const isPasswordValid = await bcrypt.compare(password, faculty.password);
  
        if (!isPasswordValid) {
          return res.status(400).send({
            isSuccess: false,
            message: "Invalid password",
          });
        }
  
        const token = generateToken({ email });
  
        return res.status(200).send({
          isSuccess: true,
          message: "Faculty login successful",
          jwtToken: token,
        });
      } catch (error) {
        console.error("Error during faculty login:", error);
        return res.status(500).send({
          isSuccess: false,
          message: "Login failed",
        });
      }
    }
  );

  router.post("/reset-password", async (req, res) => {
    const { email } = req.body;
    // console.log('email:', email);
  
    try {
      // Find user by email
      const user = await Faculty.findOne({ email: email });
      if (!user) {
        return res.status(400).send({ message: "User not found" });
      }
  
      // Check if the user already has a reset token
      let existingToken = await Token.findOne({ userId: user._id });
      if (existingToken) {
        // Delete the existing token or update it
        await Token.deleteOne({ userId: user._id });
        // console.log('Existing token deleted');
      }
  
      // Generate a new reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
  
      // Save the new token in the database
      const token = new Token({
        userId: user._id,
        token: resetToken,
      });
      await token.save();
  
      // Create the password reset URL
      const resetUrl = `${process.env.BASE_URL}reset-password/${user._id}/${resetToken}`;
  
      // Send the reset email
      const subject = "Password Reset Request";
      const text = `Click the following link to reset your password: ${resetUrl}`;
      await sendEmail(user.email, subject, text);
  
      res.status(200).send({ message: "Password reset link sent to your email." });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).send({ message: "Internal server error" });
    }
  });

  router.post('/reset-password/:userId/:token', async (req, res) => {
    const { userId, token } = req.params;
    const { newPassword } = req.body;
    console.log('userid from /api:',req.params.userId,token);
    try {
      // Validate userId format
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).send({ message: "Invalid user ID format" });
      }
    
      // Convert userId to ObjectId
      const objectIdUserId = new mongoose.Types.ObjectId(userId);
    
      // Validate the token and find the user
      const tokens = await Token.findOne({ userId: objectIdUserId, token });
      if (!tokens) {
        return res.status(400).send({ message: "Invalid or expired token" });
      }
    
      const user = await Faculty.findById(objectIdUserId);
      if (!user) {
        return res.status(400).send({ message: "User not found" });
      }
    
      // Hash the new password and update the user
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();
    
      // Remove the token to prevent reuse
     // Remove the token to prevent reuse
      await tokens.deleteOne();

    
      res.status(200).send({ message: "Password reset successful" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).send({ message: "Internal server error" });
    }  });



module.exports = router;
