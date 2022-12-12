var mongoose=require('mongoose')
let d = new Date();
let x=d.getMonth()+1
var otpSchemar=new mongoose.Schema({
    Phone_number:{
        type: String,
        required: true,
        unique: true
    },
    Email: {
        type: String,
        required: true,
        unique: true,
    },
    otp:{
        type: String,
        required: true,
        unique: true,
    }
},{timestamps:true});
var Otp=mongoose.model('Otp',otpSchemar)
module.exports=Otp;