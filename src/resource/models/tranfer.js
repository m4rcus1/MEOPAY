let d = new Date();
let x=d.getMonth()+1
var mongoose=require('mongoose')
var tranferschema=new mongoose.Schema({
    ID:{
        type: String,
        required: true
    },
    Phone_number:{
        type: String,
        required: true,
    }, 
    Phone_number_rec:{
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
});
var tranfer=mongoose.model('tranfer',tranferschema)
module.exports=tranfer;