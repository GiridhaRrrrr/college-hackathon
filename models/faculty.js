const mongoose=require("mongoose");
const Schema=mongoose.Schema;

const facultySchema=new Schema({
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
    position:{
        type:String,
        default:"Faculty",
    },
    verified:{
        type:Boolean,
        default:false,
    },
});

const Faculty=mongoose.model("Faculty",facultySchema);
module.exports=Faculty; 