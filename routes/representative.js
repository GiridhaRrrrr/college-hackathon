const express = require("express");
const router = express.Router();
const Student = require("../models/student.js");
const Complaint = require("../models/complaints.js");
const authenticate=require("../middleware/authenticate.js");
const dotenv = require("dotenv");
const sendEmail=require("../middleware/sendMail.js");
const Token = require("../models/token.js");
const crypto=require("crypto");



const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const dotenv = require("dotenv");
const validateEmailDomain = require("../middleware/validateEmailDomain");
dotenv.config(); // Load environment variables
const generateToken = (payload) => jwt.sign(payload, "hi");


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
        const students = await Student.findById(id);
        if (!students) {
            return res.status(404).json({ isSuccess: false, message: "student not found" });
        }
        res.status(200).json({ isSuccess: true, students: students });
    } catch (error) {
        res.status(500).json({ isSuccess: false, message: "Failed to retrieve students", error: error.message });
    }
});

// GET /student/complaint - Retrieve complaints for the current student
router.get("/complaint",authenticate, async (req, res) => {
    try {
        const {id} = req.user.id;//from jwt
        // if (!studentId) {
        //     return res.status(400).json({ isSuccess: false, message: "Student ID is required" });
        // }
        const complaints = await Student.findById({id}).populate(
            {path:"complaints",
            } 
          )
        res.status(200).json({ isSuccess: true, complaints: complaints });
    } catch (error) {
        res.status(500).json({ isSuccess: false, message: "Failed to retrieve complaints", error: error.message });
    }
});

// POST /student/complaint - Create a new complaint
router.post("/complaint",authenticate, async (req, res) => {
    try {
        const {id}=req.user.id;
        const {title, description,img} = req.body;
        if (!id || !title || !description) {
            return res.status(400).json({ isSuccess: false, message: "All fields are required" });
        }
        const newComplaint = new Complaint({
            title:title,
            complaintDescription:description,
            complaintImg:img,
            raisedBy:id
        });
        await newComplaint.save(); // Save the new complaint to the database
        res.status(201).json({ isSuccess: true, message: "Complaint created successfully", complaint: newComplaint });
    } catch (error) {
        res.status(500).json({ isSuccess: false, message: "Failed to create complaint", error: error.message });
    }
});

// PATCH /student/complaint - Update a specific complaint
// router.patch("/complaint", async (req, res) => {
//     try {
//         const { complaintId, title, description,img } = req.body;
//         // if (!complaintId || !updates) {
//         //     return res.status(400).json({ isSuccess: false, message: "Complaint ID and updates are required" });
//         // }
//         const updates = new Complaint({
//             title:title,
//             complaintDescription:description,
//             complaintImg:img,
//         });
//         const updatedComplaint = await Complaint.findByIdAndUpdate(complaintId, updates, { new: true }); // Update the complaint
//         if (!updatedComplaint) {
//             return res.status(404).json({ isSuccess: false, message: "Complaint not found" });
//         }
//         res.status(200).json({ isSuccess: true, message: "Complaint updated successfully", complaint: updatedComplaint });
//     } catch (error) {
//         res.status(500).json({ isSuccess: false, message: "Failed to update complaint", error: error.message });
//     }
// });

// DELETE /student/complaint - Delete a specific complaint
// router.delete("/complaint", async (req, res) => {
//     try {
//         const { complaintId } = req.body;
//         if (!complaintId) {
//             return res.status(400).json({ isSuccess: false, message: "Complaint ID is required" });
//         }
//         const deletedComplaint = await Complaint.findByIdAndDelete(complaintId); // Delete the complaint
//         if (!deletedComplaint) {
//             return res.status(404).json({ isSuccess: false, message: "Complaint not found" });
//         }
//         res.status(200).json({ isSuccess: true, message: "Complaint deleted successfully" });
//     } catch (error) {
//         res.status(500).json({ isSuccess: false, message: "Failed to delete complaint", error: error.message });
//     }
// });

// GET /student/complaint/all - Retrieve all complaints (admin/staff)

router.get("/complaint/all", async (req, res) => {
    try {
        const complaints = await Complaint.find(); // Retrieve all complaints
        res.status(200).json({ isSuccess: true, complaints: complaints });
    } catch (error) {
        res.status(500).json({ isSuccess: false, message: "Failed to retrieve complaints", error: error.message });
    }
});

// GET /student/complaint/all/:id - Retrieve a specific complaint by ID
router.get("/complaint/:id", async (req, res) => {
    try {
        const {id} = req.query;
        const complaint = await Complaint.findById(id); // Retrieve complaint by its ID
        if (!complaint) {
            return res.status(404).json({ isSuccess: false, message: "Complaint not found" });
        }
        res.status(200).json({ isSuccess: true, complaint: complaint });
    } catch (error) {
        res.status(500).json({ isSuccess: false, message: "Failed to retrieve complaint", error: error.message });
    }
});

// // GET /faculty/complaint/all - Retrieve all complaints
// router.get("/complaint/all", async (req, res) => {
//     try {
//         const complaints = await Complaint.find(); // Retrieve all complaints
//         res.status(200).json({ isSuccess: true, complaints: complaints });
//     } catch (error) {
//         res.status(500).json({ isSuccess: false, message: "Failed to retrieve complaints", error: error.message });
//     }
// });

// // GET /faculty/complaint/:id - Retrieve a specific complaint by ID
// router.get("/complaint/:id", async (req, res) => {
//     try {
//         const { id } = req.params;
//         const complaint = await Complaint.findById(id); // Retrieve complaint by ID
//         if (!complaint) {
//             return res.status(404).json({ isSuccess: false, message: "Complaint not found" });
//         }
//         res.status(200).json({ isSuccess: true, complaint: complaint });
//     } catch (error) {
//         res.status(500).json({ isSuccess: false, message: "Failed to retrieve complaint", error: error.message });
//     }
// });

router.post(
    "/representative/login",
    validateRequestBody(["email", "password"]),
    async (req, res) => {
      try {
        const { email, password } = req.body;
        const student = await Student.findOne({ email });
  
        if (!student) {
          return res.status(400).send({
            isSuccess: false,
            message: "Invalid student representative email",
          });
        }
  
        // Check if the student is registered as a representative
        if (!student.isRepresentative) {
          return res.status(400).send({
            isSuccess: false,
            message: "Student email is not registered as a representative email",
          });
        }
  
        const isPasswordValid = await bcrypt.compare(password, student.password);
  
        if (!isPasswordValid) {
          return res.status(400).send({
            isSuccess: false,
            message: "Invalid password",
          });
        }
  
        const token = generateToken({ email });
  
        return res.status(200).send({
          isSuccess: true,
          message: "Representative login successful",
          jwtToken: token,
        });
      } catch (error) {
        console.error("Error during representative login:", error);
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
      const user = await Student.findOne({ email: email });
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
    
      const user = await Student.findById(objectIdUserId);
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