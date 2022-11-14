var mongoose=require('mongoose')
var userSchemar=new mongoose.Schema({
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
    Fullname:{
        type:String,
        required:true,
    },
    BirthDay:{
        type:String,
        required:true,
    },
    Address:{
        type:String,
        required:true,
    },Ident_front:{
        type:String,
        required:true,
    },Ident_back:{
        type:String,
        required:true
    },
    Username:{
        type:String,
        required:true  ,
        unique: true
    },Password:{
        type:String,
        required:true
    },Unusual_login:{
        type:Number,
        default:0
    },Status:{
        type:Number,
        default:0
    }
});
var User=mongoose.model('User',userSchemar)
module.exports=User;