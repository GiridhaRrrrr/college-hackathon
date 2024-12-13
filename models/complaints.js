const mongoose=require("mongoose");
const Schema=mongoose.Schema;

const complaintSchema=new Schema({
    title:{
        type:String,
        required:true,
    },
    complaintDescription:{
        type:String,
        required:true,
    },
    complaintImg:{
        url:String,
    },
    date: {
        type: Date, // Correct type declaration
        default: Date.now // Optional: default to the current date/time
    },
    raisedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"student"//refernce of the object id is review model
    },
    status: {
        type: String,
        enum: ["resolved", "acknowledged", "pending"], // Enum values for status
        default: "pending", // Default status
    },
    resolvedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"faculty"//refernce of the object id is review model
    },
    resolvedDescription:{
        type:String,
    },
    resolvedImg:{
        url:String,
    },
    resolvedDate: {
        type: Date, // Field type is Date
        default: null // Default value is null (optional)
    },
});

const Complaint=mongoose.model("Complaint",complaintSchema);
module.exports=Complaint; 