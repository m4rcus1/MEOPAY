let d = new Date();
let x=d.getMonth()+1
var mongoose=require('mongoose')
var cardschema=new mongoose.Schema({
    ID:{
        type: String,
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
});
var card=mongoose.model('card',cardschema)
module.exports=card;