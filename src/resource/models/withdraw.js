let d = new Date();
let x=d.getMonth()+1
var mongoose=require('mongoose')
var withdrawschema=new mongoose.Schema({
    ID:{
        type: String,
        unique: true,   
        required: true
    },
    Phone_number:{
        type: String,
        required: true,
    }, 
    CardNumber:{
        type: String,
        required: true,
    },
    Amount:{
        type:Number,
        required: true
    },
    Date:{
        type: String,
        required: true,
        default: d.getDate()+"/"+x+"/"+d.getFullYear()
    },
    Note:{
        type:String,
        required:true
    },
    Status:{
        type:Number,
        required: true,
        default:1
    }
},{timestamps:true});
var withdraw=mongoose.model('withdraw',withdrawschema)
module.exports=withdraw;