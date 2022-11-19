var mongoose=require('mongoose')
var tranfersschema=new mongoose.Schema({
    ID:{
        type: String,
        required: true
    },
    Phone_number:{
        type: String,
        required: true,
    },  
    Amount:{
        type:Number,
        required: true
    },
    Date:{
        type: Date,
        required: true,
        default: new Date()
    },
    Status:{
        type:Number,
        required: true,
        default:1
    }
});
var tranfers=mongoose.model('tranfers',tranfersschema)
module.exports=tranfers;