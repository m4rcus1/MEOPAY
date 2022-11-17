var mongoose=require('mongoose')
var wSchemar=new mongoose.Schema({
    Phone_number:{
        type: String,
        required: true,
        unique: true
    },
    Wallet_Surplus:{
        type: Number,
        default:0
    },
});
var Wallet=mongoose.model('wallet',wSchemar)
module.exports=Wallet;