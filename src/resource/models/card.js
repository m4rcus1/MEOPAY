let d = new Date();
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
        default: d.getDate()+"/"+d.getMonth()+"/"+d.getFullYear()
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