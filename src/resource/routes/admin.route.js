var express = require('express');
var admin = express.Router();
var bodyParser = require('body-parser');
let async = require('async');
const fs = require('fs');
const bcrypt = require("bcrypt");
const saltRounds = 10;
const session = require('express-session');
var mv = require('mv');
var cookieParser = require('cookie-parser');

admin.use(cookieParser())
const multiparty = require('multiparty');
admin.use(bodyParser.urlencoded({
    extended: true
}));
//db
const User = require("../models/user");
const Wallet = require("../models/wallet");
const H_trade = require("../models/trade_history");
const withdraws = require("../models/withdraw");
const tranfers = require("../models/tranfer")
const card = require("../models/card");
const mongoose = require("mongoose")
let d = new Date();
db = require("../lib/db")
const urlencodedParser = bodyParser.urlencoded({ extended: false });

//session
admin.use(session({
    secret: 'keyboard cat',
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
    resave: true,
    saveUninitialized: false,
    expires: new Date(Date.now() + (30 * 86400 * 1000))
}));
async function get_user(status) {
    let x = await User.find({ Status: status });
    return new Promise(function(res, rej) {
        res(x)
    })
}
admin.get('/', function (req, res) {
    if(req.session.admin){let tr1 =``
    let tr2=``
    let tr3=``
    let tr4=``
    get_user(1).then(function(u1){
        get_user(2).then(function(u2){
            get_user(-1).then(function(u3){
                get_user(-2).then(function(u4){
                    for (let i = 0; i < u1.length; i++) {
                        tr1 += `
                        <form id="active${u1[i].Phone_number}" method="post" action='admin/active'><tr class="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100">
                        <input type="hidden" id="custId" name="Phone_number" value="${u1[i].Phone_number}">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${u1[i].BirthDay}</td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                               ${u1[i].Fullname}
                        </td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                            ${u1[i].Phone_number}
                        </td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                            ${u1[i].Email}
                                
                        </td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                            <img src='${u1[i].Ident_front}' style="width:300px;height=150px">
                            <img src='${u1[i].Ident_back}' style="width:300px;height=150px">
                        </td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                Chưa kích hoạt
                        </td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                        <select name="action">
                            <option value="2">Kích hoạt</option>
                            <option value="-1">Khóa</option>
                        </select>
                                <button type="submit">Action</button>
                        </td>
                        </tr></form>`
                    }
                    for (let i = 0; i < u2.length; i++) {
                        tr2 += `
                        <form id="active${u2[i].Phone_number}" method="post" action='admin/active'><tr class="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100">
                        <input type="hidden" id="custId" name="Phone_number" value="${u2[i].Phone_number}">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${u2[i].BirthDay}</td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                               ${u2[i].Fullname}
                        </td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                            ${u2[i].Phone_number}
                        </td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                            ${u2[i].Email}
                                
                        </td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                            <img src='${u2[i].Ident_front}' style="width:50px;height:50px">
                            <img src='${u2[i].Ident_back}' style="width:50px;height:50px">
                        </td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                Đã kích hoạt
                        </td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                        <select name="action">
                            <option value="-1">Khóa</option>
                        </select>
                                <button type="submit">Action</button>
                        </td>
                        </tr></form>`
                    }
                    for (let i = 0; i < u3.length; i++) {
                        tr3 += `
                        <form method="post" action='admin/active'><tr class="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100">
                        <input type="hidden" id="custId" name="Phone_number" value="${u3[i].Phone_number}">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${u3[i].BirthDay}</td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                               ${u3[i].Fullname}
                        </td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                            ${u3[i].Phone_number}
                        </td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                            ${u3[i].Email}
                                
                        </td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                            <img src="${u3[i].Ident_front}" style="width:300px;height=150px">
                            <img src='${u3[i].Ident_back}' style="width:300px;height=150px">
                        </td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                Tạm vô hiệu hóa
                        </td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                        <select name="action">
                            <option value="-1">Khóa</option>
                        </select>
                                <button type="submit">Action</button>
                        </td>
                        </tr></form>`
                    }
                    for (let i = 0; i < u4.length; i++) {
                        tr4 += `
                        <form id="active${u4[i].Phone_number}" method="post" action='admin/active'><tr class="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100">
                        <input type="hidden" id="custId" name="Phone_number" value="${u4[i].Phone_number}">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${u4[i].BirthDay}</td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                               ${u4[i].Fullname}
                        </td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                            ${u4[i].Phone_number}
                        </td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                            <img src='${u4[i].Ident_front}' style="width:300px;height=150px">
                            <img src='${u4[i].Ident_back}' style="width:300px;height=150px">
                        </td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                            ${u4[i].Email}         
                        </td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                Vô hiệu hóa
                        </td>
                        <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                        <select name="action">
                            <option value="-1">Khóa</option>
                        </select>
                                <button type="submit">Action</button>
                        </td>
                        </tr></form>`
                    }   
                    res.render('admin',{tr1:tr1,tr2:tr2,tr3:tr3,tr4:tr4})
                })
            })
            
            
            
        })
        
    })}else{
        res.redirect('/login')
    }
    
    
})
admin.post(`/active`, function (req, res) {
    let st=Number(req.body.action)
    console.log(req.body)
    User.updateOne({ Phone_number:req.body.Phone_number}, {Status: st }, function() {})
    res.redirect('/admin')
})



module.exports = admin