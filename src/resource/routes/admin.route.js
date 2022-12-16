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
var currencyFormatter = require('currency-formatter');
admin.use(cookieParser())
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'anhq6009@gmail.com',
        pass: 'yrrsfdrowpjppsoq'
    }
});
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
    return new Promise(function (res, rej) {
        res(x)
    })
}
async function get_user_phone(phone) {
    let x = await User.find({ Phone_number: phone });
    return new Promise(function(res, rej) {
        res(x)
    })
}
async function get_trade(status) {
    let x = await H_trade.find({ Status: status });
    return new Promise(function (res, rej) {
        res(x)
    })
}
async function get_h_trade(id) {
    let x = await H_trade.find({ ID: id })
    return new Promise(function (res, rej) {
        res(x)
    })
}
async function sendEmail(phone, phone_send, amount, note) {
    User.find({ Phone_number: phone }, function (err, docs) {
        let x = `Bạn được nhận số tiền ${currencyFormatter.format(amount, { code: 'VND' })} từ người dùng có số điện thoại ${phone_send} với lời nhắn: \n ${note} `
        var mailOptions = {
            from: 'anhq6009@gmail.com',
            to: docs[0].Email,
            subject: 'Nhận tiền',
            text: x + ""
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    })

}
function set(money) {
    let VND = new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'VND'
    })
    return VND.format(money)
}
async function get_user_surplus(phone) {
    let x = await Wallet.find({ Phone_number: phone });
    return new Promise(function (res, rej) {
        res(x)
    })
}
admin.get('/', function (req, res) {
    if (req.session.admin) {
        let tr1 = ``
        let tr2 = ``
        let tr3 = ``
        let tr4 = ``
        get_user(1).then(function (u1) {
            get_user(2).then(function (u2) {
                get_user(-1).then(function (u3) {
                    get_user(-2).then(function (u4) {
                        for (let i = 0; i < u1.length; i++) {
                            tr1 += `
                        <form id="active${u1[i].Phone_number}" method="post" action='admin/us1'><tr class="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100">
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
                            <option value="Xem">Xem chi tiết</option>
                            <option value="Kích hoạt">Kích hoạt</option>
                            <option value="Yêu cầu update">Yêu cầu update</option>
                            <option value="Khóa">Khóa</option>
                        </select>
                                <button type="submit">Action</button>
                        </td>
                        </tr></form>`
                        }
                        for (let i = 0; i < u2.length; i++) {
                            tr2 += `
                        <form id="active${u2[i].Phone_number}" method="post" action='admin/us2'><tr class="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100">
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
                            <option value="Xem">Xem chi tiết</option>
                            <option value="Khóa">Khóa</option>
                        </select>
                                <button type="submit">Action</button>
                        </td>
                        </tr></form>`
                        }
                        for (let i = 0; i < u3.length; i++) {
                            tr3 += `
                        <form method="post" action='admin/us3'><tr class="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100">
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
                            <option value="Xem">Xem chi tiết</option>
                            <option value="Unlock">Mở khóa</option>
                        </select>
                                <button type="submit">Action</button>
                        </td>
                        </tr></form>`
                        }
                        for (let i = 0; i < u4.length; i++) {
                            tr4 += `
                        <form id="active${u4[i].Phone_number}" method="post" action='admin/us4'><tr class="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100">
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
                            <option value="Xem">Xem chi tiết</option>
                            <option value="Unlock">Mở khóa</option>
                        </select>
                                <button type="submit">Action</button>
                        </td>
                        </tr></form>`
                        }
                        res.render('admin', { tr1: tr1, tr2: tr2, tr3: tr3, tr4: tr4, layout: 'adminLayout' })
                    })
                })
            })
        })
    } else {
        res.redirect('/login')
    }


})
admin.post(`/us1`, function (req, res) {
    let st = Number(req.body.action);
    if (req.body.action == "Kích hoạt") {
        User.updateOne({ Phone_number: req.body.Phone_number }, { Status: 2, old_Status: 2 }, function () { })
        res.redirect('/admin')
    } else if (req.body.action == "Xem") {
        User.find({ Phone_number: req.body.Phone_number }, function (err, docs) {
            if (docs) {
                console.log(req.body.Phone_number)
                let u = get_user_phone(req.body.Phone_number)
                u.then(function (us) {
                    Wallet.find({ Phone_number: us[0].Phone_number }, function (err, docs) {
                        if (docs) {
                            console.log(us[0].Status)
                            
                                if (us[0].warning != ""){
                                    console.log(1)
                                    return res.render('profile_admin', {
                                        status: us[0].Status, name: us[0].Fullname, Birth: us[0].BirthDay, Phone_number: us[0].Phone_number, Email: us[0].Email, Address: us[0].Address, surplus: docs[0].Wallet_Surplus, status1: "Chưa active", warning: us[0].warning, show: true, img1: "."+us[0].
                                            Ident_front, img2:"."+ us[0].Ident_back
                                    });}
                                    
                                else{return res.render('profile_admin', {
                                    status: us[0].Status, name: us[0].Fullname, Birth: us[0].BirthDay, Phone_number: us[0].Phone_number, Email: us[0].Email, Address: us[0].Address, surplus: docs[0].Wallet_Surplus, status1: "Chưa active", warning: us[0].warning, show: false, img1: "."+ us[0].
                                    Ident_front, img2:"."+ us[0].Ident_back
                                });}
                                    
                        } else {
                            return res.render('profile', { status: req.session.Status });
                        }
                    })
                })
            }
        })
    }else if (req.body.action == "Yêu cầu update") {
        let warning = "Yêu cầu update lại hình ảnh"
        User.updateOne({ Phone_number: req.body.Phone_number }, { warning: warning }, function () { })
    } else if (req.body.action == "Khóa") {
        User.updateOne({ Phone_number: req.body.Phone_number }, { Status: -2 }, function () { })
    }

  
})
admin.post(`/us2`, function (req, res) {
    console.log(req.body)
    if (req.body.action == "Xem") {
        User.find({ Phone_number: req.body.Phone_number }, function (err, docs) {
            if (docs) {
                console.log(req.body.Phone_number)
                let u = get_user_phone(req.body.Phone_number)
                u.then(function (us) {
                    console.log(us[0])
                    Wallet.find({ Phone_number: us[0].Phone_number }, function (err, docs) {
                        if (docs) {
                            console.log(us[0].Status)
                            if (us[0].Status == 2)
                                return res.render('profile_admin', {
                                    status: us[0].Status, name: us[0].Fullname, Birth: us[0].BirthDay, Phone_number: us[0].Phone_number, Email: us[0].Email, Address: us[0].Address, surplus: docs[0].Wallet_Surplus, status1: "Đã active", img1: "."+us[0].
                                        Ident_front, img2: "."+us[0].Ident_back
                                });
                        } else {
                            return res.render('profile_admin', { status: req.session.Status });
                        }
                    })
                })
            }
        })

    } else {
        User.updateOne({ Phone_number: req.body.Phone_number }, { Status: -2 }, function () { })
        res.redirect('/admin')
    }

})
admin.post(`/us3`, function (req, res) {
    if (req.body.action == "Xem") {
        User.find({ Phone_number: req.body.Phone_number }, function (err, docs) {
            if (docs) {
                console.log(req.body.Phone_number)
                let u = get_user_phone(req.body.Phone_number)
                u.then(function (us) {
                    console.log(us[0])
                    Wallet.find({ Phone_number: us[0].Phone_number }, function (err, docs) {
                        if (docs) {
                            console.log(us[0].Status)
                            if (us[0].Status == -1)
                                return res.render('profile_admin', {
                                    status: us[0].Status, name: us[0].Fullname, Birth: us[0].BirthDay, Phone_number: us[0].Phone_number, Email: us[0].Email, Address: us[0].Address, surplus: docs[0].Wallet_Surplus, status1: "Đã active", img1: "."+us[0].
                                        Ident_front, img2: "."+us[0].Ident_back
                                });
                        } else {
                            return res.render('profile_admin', { status: req.session.Status });
                        }
                    })
                })
            }
        })

    }else{User.find({ Phone_number: req.body.Phone_number }, function (err, docs) {
        if (docs) {
            User.updateOne({ Phone_number: req.body.Phone_number }, { Status: docs[0].old_Status }, function () { })
        }
    })
    res.redirect('/admin')}
    
})
admin.post(`/us4`, function (req, res) {
    if (req.body.action == "Xem") {
        User.find({ Phone_number: req.body.Phone_number }, function (err, docs) {
            if (docs) {
                console.log(req.body.Phone_number)
                let u = get_user_phone(req.body.Phone_number)
                u.then(function (us) {
                    console.log(us[0])
                    Wallet.find({ Phone_number: us[0].Phone_number }, function (err, docs) {
                        if (docs) {
                            console.log(us[0].Status)
                            if (us[0].Status == -2)
                                return res.render('profile_admin', {
                                    status: us[0].Status, name: us[0].Fullname, Birth: us[0].BirthDay, Phone_number: us[0].Phone_number, Email: us[0].Email, Address: us[0].Address, surplus: docs[0].Wallet_Surplus, status1: "Đã active", img1: "."+us[0].
                                        Ident_front, img2: "."+us[0].Ident_back
                                });
                        } else {
                            return res.render('profile_admin', { status: req.session.Status });
                        }
                    })
                })
            }
        })

    }else{
    User.find({ Phone_number: req.body.Phone_number }, function (err, docs) {
        if (docs) {
            console.log(docs[0])
            User.updateOne({ Phone_number: req.body.Phone_number }, { Status: docs[0].old_Status,Unusual_login:0 }, function () { })
        }
    })
    res.redirect('/admin')}
})
admin.get('/tranfers', function (req, res) {
    let trd = ""
    let trd_s = ""
    let trd_w = ""
    let trd_f = ""
    if (req.session.admin) {
        H_trade.find({}, function (err, docs) {
            get_trade(1).then(function (suc) {
                get_trade(0).then(function (wait) {
                    for (let i = docs.length - 1; i >= 0; i--) {
                        let s = "Thành công";
                        if (docs[i].Status == 0) {
                            s = "Đang chờ xử lý"
                        } else if (docs[i].Status == -1) {
                            s = "Thất bại"
                        }
                        trd += `
                        <form method="post" action="/admin/tranfers/chi-tiet1">
                            <tr class="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100">
                                   
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        ${docs[i].ID}
                                    </td>
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        ${docs[i].Phone_number}
                                    </td>
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        ${docs[i].Date}
                                    </td>
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        ${docs[i].Type_trade}
                                    </td>
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        ${set(docs[i].Amount)}
                                    </td>
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        ${s}
                                    </td>
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        <input type="hidden" name="id_c" value="${docs[i].ID}">
                                        <button type="submit">Xem chi tiết </button>
                                    </td>
                        </form>   
                    </tr>
                    `

                    }
                    for (let i = suc.length - 1; i >= 0; i--) {
                        trd_s += `
                        <form method="post" action="/admin/tranfers/chi-tiet1">
                            <tr class="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100">
                                   
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        ${suc[i].ID}
                                    </td>
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        ${suc[i].Phone_number}
                                    </td>
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        ${suc[i].Date}
                                    </td>
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        ${suc[i].Type_trade}
                                    </td>
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        ${set(suc[i].Amount)}
                                    </td>
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        Thanh cong
                                    </td>
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        <input type="hidden" name="id_c" value="${suc[i].ID}">
                                        <button type="submit">Xem chi tiết </button>
                                    </td>
                        </form>   
                    </tr>
                    `

                    }
                    for (let i = wait.length - 1; i >= 0; i--) {
                        trd_w += `
                        <form method="post" action="/admin/tranfers/chi-tiet">
                            <tr class="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100">
                                   
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        ${wait[i].ID}
                                    </td>
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        ${wait[i].Phone_number}
                                    </td>
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        ${wait[i].Date}
                                    </td>
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        ${wait[i].Type_trade}
                                    </td>
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        ${set(wait[i].Amount)}
                                    </td>
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        Đang chờ
                                    </td>
                                    <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        <input type="hidden" name="id_c" value="${wait[i].ID}">
                                        <input type="hidden" name="type" value="${wait[i].Type_trade}">
                                        <select name="action">
                                            <option value="Xem">Xem chi tiết</option>
                                            <option value="Thành công">Duyệt</option>
                                            <option value="Thất bại">Hủy</option>
                                        </select>

                                        <button type="submit">Action</button>
                                    </td>
                        </form>   
                    </tr>
                    `

                    }
                    res.render("admin_tranfers", { trd_w: trd_w, trd_s: trd_s, trd: trd, layout: 'adminLayout' })
                })



            })

        })
    } else {
        res.redirect('/login')
    }


})
admin.post(`/tranfers/chi-tiet1`, function (req, res){
    let trade = get_h_trade(req.body.id_c)
    trade.then(function (tra) {
        if (tra[0].Status == 1) {
            t = "Thành công"
        } else if (tra[0].Status == -1) {
            t = "Thất bại"
        } else {
            t = "Đang được xét duyệt"
        }
        if (tra[0].Type_trade == "nap tien") {
            console.log(1)
            res.render('transaction-details', { id: tra[0].ID, type: tra[0].Type_trade, name: req.session.Fullname, Status: t, Date: tra[0].Date, money: tra[0].Amount, fee: 0, status: req.session.Status })
        }
        else if (tra[0].Type_trade == "rut tien") {
            withdraws.find({ ID: tra[0].ID }, function (err, docs) {
                if (docs) {
                    let m = ` <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[30px]">Thẻ nhận </div>
                    <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[100px] lg:col-span-2 ">${docs[0].CardNumber}</div>
                    <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[30px]">Lời nhắn</div>
                    <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[100px] lg:col-span-2 ">${docs[0].Note}</div>`
                    let fee = tra[0].Amount * 5 / 100
                    res.render('transaction-details', { status: req.session.Status, name: req.session.Fullname, id: tra[0].ID, type: tra[0].Type_trade, Status: t, Date: tra[0].Date, money: tra[0].Amount, fee: fee, message: m })
                }
            })
        }
        else if (tra[0].Type_trade == "chuyen tien") {
            tranfers.find({ ID: tra[0].ID }, function (err, docs) {
                if (docs) {
                    console.log(docs[0])
                    let m = ` <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[30px]">Số điện thoại nhận</div>
                    <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[100px] lg:col-span-2 ">${docs[0].Phone_number_rec}</div>
                    <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[30px]">Lời nhắn</div>
                    <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[100px] lg:col-span-2 ">${docs[0].Note}</div>`
                    let fee = tra[0].Amount * 5 / 100
                    res.render('transaction-details', { status: req.session.Status, name: req.session.Fullname, id: tra[0].ID, type: tra[0].Type_trade, Status: t, Date: tra[0].Date, money: tra[0].Amount, fee: fee, message: m })
                }
            })
        }
        else if (tra[0].Type_trade == "mua card") {
            card.find({ ID: tra[0].ID }, function (err, docs) {
                if (docs) {
                    let m = ` <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[30px]">Số điện thoại nhận</div>
                    <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[100px] lg:col-span-2 ">${docs[0].Phone_number_rec}</div>
                    <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[30px]">Lời nhắn</div>
                    <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[100px] lg:col-span-2 ">${docs[0].Note}</div>`
                    // let fee=tra[0].Amount*5/100
                    let str = ""
                    if (docs[0].Card_number.slice(0, 5) == "11111") {
                        str = "Viettel"
                    } else if (docs[0].Card_number.slice(0, 5) == "22222") {
                        str = "Mobifone"
                    } else if (docs[0].Card_number.slice(0, 5) == "33333") {
                        str = "Vinaphone"
                    }
                    // let x = `<div class="flex pl-[15px] lg:pl-0 text-xs lg:text-2xl basis-1/2 py-[10px]">1111111</div>
                    // <div class="flex pl-[15px] lg:pl-0 text-xs lg:text-2xl basis-1/2 py-[10px]">2222222</div>
                    // <div class="flex pl-[15px] lg:pl-0 text-xs lg:text-2xl basis-1/2 py-[10px]">3333333</div>
                    // <div class="flex pl-[15px] lg:pl-0 text-xs lg:text-2xl basis-1/2 py-[10px]">4444444</div>`
                    let ca = ""
                    let temp1 = docs[0].Card_number
                    console.log(str)
                    let temp = temp1.split("/")
                    for (let i = 0; i < temp.length; i++) {
                        ca += `<div class="flex pl-[15px] lg:pl-0 text-xs lg:text-2xl basis-1/2 py-[10px]">${temp[i]}</div>`
                    }
                    res.render('listOfCards', { status: req.session.Status, name: req.session.Fullname, type: str, price: docs[0].Price, Date: tra[0].Date, card: ca })
                }
            })
        }
    })
})
admin.post(`/tranfers/chi-tiet`, function (req, res) {
    let trade = get_h_trade(req.body.id_c)

    let t = ""
    console.log(req.body)
    if (req.body.action == "Xem") {
        trade.then(function (tra) {
            if (tra[0].Status == 1) {
                t = "Thành công"
            } else if (tra[0].Status == -1) {
                t = "Thất bại"
            } else {
                t = "Đang được xét duyệt"
            }
            if (tra[0].Type_trade == "nap tien") {
                console.log(1)
                res.render('transaction-details', { id: tra[0].ID, type: tra[0].Type_trade, name: req.session.Fullname, Status: t, Date: tra[0].Date, money: tra[0].Amount, fee: 0, status: req.session.Status })
            }
            else if (tra[0].Type_trade == "rut tien") {
                withdraws.find({ ID: tra[0].ID }, function (err, docs) {
                    if (docs) {
                        let m = ` <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[30px]">Thẻ nhận </div>
                        <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[100px] lg:col-span-2 ">${docs[0].CardNumber}</div>
                        <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[30px]">Lời nhắn</div>
                        <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[100px] lg:col-span-2 ">${docs[0].Note}</div>`
                        let fee = tra[0].Amount * 5 / 100
                        res.render('transaction-details', { status: req.session.Status, name: req.session.Fullname, id: tra[0].ID, type: tra[0].Type_trade, Status: t, Date: tra[0].Date, money: tra[0].Amount, fee: fee, message: m })
                    }
                })
            }
            else if (tra[0].Type_trade == "chuyen tien") {
                tranfers.find({ ID: tra[0].ID }, function (err, docs) {
                    if (docs) {
                        console.log(docs[0])
                        let m = ` <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[30px]">Số điện thoại nhận</div>
                        <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[100px] lg:col-span-2 ">${docs[0].Phone_number_rec}</div>
                        <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[30px]">Lời nhắn</div>
                        <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[100px] lg:col-span-2 ">${docs[0].Note}</div>`
                        let fee = tra[0].Amount * 5 / 100
                        res.render('transaction-details', { status: req.session.Status, name: req.session.Fullname, id: tra[0].ID, type: tra[0].Type_trade, Status: t, Date: tra[0].Date, money: tra[0].Amount, fee: fee, message: m })
                    }
                })
            }
            else if (tra[0].Type_trade == "mua card") {
                card.find({ ID: tra[0].ID }, function (err, docs) {
                    if (docs) {
                        let m = ` <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[30px]">Số điện thoại nhận</div>
                        <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[100px] lg:col-span-2 ">${docs[0].Phone_number_rec}</div>
                        <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[30px]">Lời nhắn</div>
                        <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[100px] lg:col-span-2 ">${docs[0].Note}</div>`
                        // let fee=tra[0].Amount*5/100
                        let str = ""
                        if (docs[0].Card_number.slice(0, 5) == "11111") {
                            str = "Viettel"
                        } else if (docs[0].Card_number.slice(0, 5) == "22222") {
                            str = "Mobifone"
                        } else if (docs[0].Card_number.slice(0, 5) == "33333") {
                            str = "Vinaphone"
                        }
                        // let x = `<div class="flex pl-[15px] lg:pl-0 text-xs lg:text-2xl basis-1/2 py-[10px]">1111111</div>
                        // <div class="flex pl-[15px] lg:pl-0 text-xs lg:text-2xl basis-1/2 py-[10px]">2222222</div>
                        // <div class="flex pl-[15px] lg:pl-0 text-xs lg:text-2xl basis-1/2 py-[10px]">3333333</div>
                        // <div class="flex pl-[15px] lg:pl-0 text-xs lg:text-2xl basis-1/2 py-[10px]">4444444</div>`
                        let ca = ""
                        let temp1 = docs[0].Card_number
                        console.log(str)
                        let temp = temp1.split("/")
                        for (let i = 0; i < temp.length; i++) {
                            ca += `<div class="flex pl-[15px] lg:pl-0 text-xs lg:text-2xl basis-1/2 py-[10px]">${temp[i]}</div>`
                        }
                        res.render('listOfCards', { status: req.session.Status, name: req.session.Fullname, type: str, price: docs[0].Price, Date: tra[0].Date, card: ca })
                    }
                })
            }
        })
    } else if (req.body.action == "Thành công") {
        if (req.body.type == "rut tien") {
            withdraws.updateOne({ ID: req.body.id_c }, { Status: 1 }, function () { })
            H_trade.updateOne({ ID: req.body.id_c }, { Status: 1 }, function () { })
            withdraws.find({ ID: req.body.id_c }, function (err, docs) {
                if (docs) {
                    console.log(docs[0].Phone_number);
                    let t = get_user_surplus(docs[0].Phone_number)
                    t.then(function (x) {
                        console.log(x[0]);
                        Wallet.updateOne({ Phone_number: docs[0].Phone_number }, { Wallet_Surplus: x[0].Wallet_Surplus - docs[0].Amount }, function () { })
                        res.redirect('/admin/tranfers')
                    })
                }

            })
        }
        else if (req.body.type == "chuyen tien") {
            H_trade.updateOne({ ID: req.body.id_c, Status: 0 }, { Status: 1 }, function () { })
            tranfers.updateOne({ ID: req.body.id_c, Status: 0 }, { Status: 1 }, function () { })
            tranfers.find({ ID: req.body.id_c }, function (err, docs) {
                console.log(docs)
                let t = get_user_surplus(docs[0].Phone_number)
                t.then(function (x) {
                    Wallet.updateOne({ Phone_number: docs[0].Phone_number }, { Wallet_Surplus: x[0].Wallet_Surplus - docs[0].Amount }, function () { })
                })
                let t1 = get_user_surplus(docs[0].Phone_number_rec)
                t1.then(function (x) {
                    Wallet.updateOne({ Phone_number: docs[0].Phone_number_rec }, { Wallet_Surplus: x[0].Wallet_Surplus + docs[0].Amount }, function () { })
                })
                sendEmail(docs[0].Phone_number_rec, docs[0].Phone_number, Number(docs[0].Amount), docs[0].Note);
                res.redirect('/admin/tranfers')
            })

        }
    }

})
module.exports = admin