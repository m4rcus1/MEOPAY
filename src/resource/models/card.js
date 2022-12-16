let d = new Date();
let x=d.getMonth()+1
var mongoose=require('mongoose')
var cardschema=new mongoose.Schema({
    ID:{
        type: String,
        unique: true,
        required: true
    },
    Phone_number:{
        type: String,
        required: true,
    }, 
    Price:{
        type: Number,
        required: true,
    },
    Date:{
        type: String,
        required: true,
        default: d.getDate()+"/"+(x)+"/"+d.getFullYear()
    },
    Card_number:{
        type:String,
        required:true
    },
    Status:{
        type:Number,
        required: true,
        default:1
    }
},{timestamps:true});
var card=mongoose.model('card',cardschema)
module.exports=card;