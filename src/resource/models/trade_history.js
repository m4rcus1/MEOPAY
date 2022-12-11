var mongoose = require('mongoose')
let d = new Date()
let x = d.getMonth() + 1
var wtrade = new mongoose.Schema({
    ID: {
        type: String,
        required: true
    },
    Phone_number: {
        type: String,
        required: true,
    },
    Type_trade: {
        type: String,
        required: true
    },
    Amount: {
        type: Number,
        required: true
    },
    Date: {
        type: String,
        required: true,
        default: d.getDate() + "/" + x + "/" + d.getFullYear()
    },
    Status: {
        type: Number,
        required: true,
        default: 1
    }
});
var H_trade = mongoose.model('H_trade', wtrade)
module.exports = H_trade;