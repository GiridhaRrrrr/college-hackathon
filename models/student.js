const mongoose=require("mongoose");
const Schema=mongoose.Schema;

const studentSchema=new Schema({
    email:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    userName:{
        type:String,
        required:true,        
    },
    isRepresentative:{
        type:Boolean,
        default:false,
    },
    complaint:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"complaints"//refernce of the object id is complaints model
    }],
    verified:{
        type:Boolean,
        default:false,
    },
});

const Student=mongoose.model("Student",studentSchema);

module.exports=Student; 