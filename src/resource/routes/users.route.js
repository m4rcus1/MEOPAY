var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
let async = require('async');
const fs = require('fs');
const bcrypt = require("bcrypt");
const saltRounds = 10;
const session = require('express-session');
var mv = require('mv');
var cookieParser = require('cookie-parser');
var currencyFormatter = require('currency-formatter');
router.use(cookieParser())
const multiparty = require('multiparty');
router.use(bodyParser.urlencoded({
    extended: true
}));

var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'anhq6009@gmail.com',
        pass: 'yrrsfdrowpjppsoq'
    }
});
//db
const User = require("../models/user");
const Wallet = require("../models/wallet");
const H_trade = require("../models/trade_history");
const withdraws = require("../models/withdraw");
const tranfers = require("../models/tranfer")
const card = require("../models/card");
const mongoose = require("mongoose");
const { isBuffer } = require('util');
let d = new Date();
db = require("../lib/db")
const urlencodedParser = bodyParser.urlencoded({ extended: false });

//session
router.use(session({
    secret: 'keyboard cat',
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
    resave: true,
    saveUninitialized: false,
    expires: new Date(Date.now() + (30 * 86400 * 1000))
}));
/* GET users listing. */


function makeid(length) {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function makecard(length) {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function makepassword(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function upload(oldPath, newPath) {
    oldPath = oldPath.replaceAll("\\", "/")
    newPath = newPath.replaceAll("\\", "/")
    mv(oldPath, newPath, function(err) {
        if (err) throw err;
        console.log(newPath)
        console.log('Successfully renamed - AKA moved!');
    })
}

async function compare(text, hash) {
    let check = await bcrypt.compare(text, hash);
    return check
}

async function checkUser() {
    let username = makeid(10)
    let x = true
    let user = await User.find({ Username: username })
    while (x) {
        console.log(user.length)
        if (user.length != 0) {
            username = makeid(10)
            user = await User.find({ Username: username })
        } else {
            x = false
            return new Promise(function(res, rej) {
                res(username);
            })
        }
    }
    return new Promise(function(res, rej) {
        res(username);
    })

}


async function check_date(phone) {
    let check = false
    let d = new Date();
    let da = d.getDate() + "/" + d.getMonth() + "/" + d.getFullYear()

    let x = await H_trade.find({ Phone_number: phone, Type_trade: "rut tien", Date: da },

    )
    return new Promise(function(res, rej) {
        res(x);
    })
}
async function get_user(phone) {
    let x = await User.find({ Phone_number: phone });
    return new Promise(function(res, rej) {
        res(x)
    })
}
async function get_user_surplus(phone) {
    let x = await Wallet.find({ Phone_number: phone });
    return new Promise(function(res, rej) {
        res(x)
    })
}

async function get_h_trade(id) {
    let x = await H_trade.find({ ID: id })
    return new Promise(function(res, rej) {
        res(x)
    })
}
async function hashpass(password) {
    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(password, salt)
    return new Promise(function(res, rej) {
        res(secPass)
    })
}
async function sendEmail(phone,phone_send,amount,note){
    User.find({ Phone_number: phone }, function(err, docs){
        let x=`Bạn được nhận số tiền ${currencyFormatter.format(amount, { code: 'VND' })} từ người dùng có số điện thoại ${phone_send} với lời nhắn: \n ${note} `
        var mailOptions = {
            from: 'anhq6009@gmail.com',
            to: docs[0].Email,
            subject: 'Nhận tiền',
            text: x + ""
        };
        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    })
    
}

router.get('/', function(req, res) {
    let x = `<div class="text-sm"> Chào ${req.session.Fullname} </div> <span><a href="/profile"><i name="user-icon" class="fa-solid fa-2x fa-user-lock pl-[10px]"></i></a></span>`
    let x1 = `<div class="text-sm"> Chào ${req.session.Fullname} </div> <span><a href="/profile"><i class="fa-solid fa-2x fa-user pl-[10px]"></i></a></span>`
    let y = `  <a href="/register"><button class="loginBtn">Đăng Ký</button></a>
    <a href="/login"><button class="registerBtn">Đăng Nhập</button></a>`
    if (req.session.Phone_number) {
           
            return res.render('home', { status: req.session.Status,name: req.session.Fullname});
    }
    return res.render('home', { status:100})
})

router.get('/login', function(req, res) {
    if (req.session.Phone_number) {
        return res.redirect('/')
        
    }
    return res.render('login', { status: 100,name: req.session.Fullname});
})

router.post('/login', urlencodedParser, function(req, res) {
    
    if(req.body.username=="admin" && req.body.password=="123456"){
        req.session.admin=true
        res.redirect('/admin')
    }
    User.find({ Username: req.body.username }, function(err, docs) {
        
        if (docs.length) {
            console.log(req.cookies.check)
            if(!req.cookies.status){
                res.cookie('status',docs[0].Status,{ expires: new Date(Date.now() + 10*60 * 1000) })                       
            }
            if(docs[0].Status==-2){
                res.render('login', { error: `<div class='alert alert-danger alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button>Liên hệ admin</div>` })
            }
            if (req.cookies.check == 'lock') {
                res.render('login', { error: `<div class='alert alert-danger alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button>Wait for 5M to login again</div>` })
            } else { 
                console.log(req.body)
                console.log(docs[0])
                if (docs[0].Status == 0) {
                    if (docs[0].Password == req.body.password) {
                        console.log(1)
                        User.updateOne({ Username: req.body.username }, { Unusual_login: 0, Status: req.cookies.status }, function() {})

                        req.session.Fullname = docs[0].Fullname
                        req.session.Fullname.expires = new Date(Date.now() + 3600000 * 24)
                        req.session.Phone_number = docs[0].Phone_number
                        req.session.Phone_number.expires = new Date(Date.now() + 3600000 * 24)
                        req.session.Email = docs[0].Email
                        req.session.Email.expires = new Date(Date.now() + 3600000 * 24)
                        req.session.Password = docs[0].Password
                        req.session.Password.expires = new Date(Date.now() + 3600000 * 24)
                        req.session.Status =  req.cookies.status
                        req.session.Status.expires = new Date(Date.now() + 3600000 * 24)
                        x = req.session
                        res.redirect('/login1st')
                    } else {
                        let count = docs[0].Unusual_login + 1
                        User.updateOne({ Username: req.body.username }, { Unusual_login: count }, function() {})
                        if (count == 3) {
                            User.updateOne({ Username: req.body.username }, { Status: -1 }, function() {
                                console.log('saved')
                            })
                            res.cookie('check', 'lock', { expires: new Date(Date.now() + 60 * 1000) });
    
                           res.render('login', { error: `<div class='alert alert-danger alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button>Wait for 5M to login again</div>` })
                        }
                         
                        else if(count>=6){
                            User.updateOne({ Username: req.body.username }, { Status: -2 }, function() {
                                console.log('saved')
                            })
                            res.cookie('check', 'lock', { expires: new Date(Date.now() + 60 * 1000) }); 
                            res.render('login', { error: `<div class='alert alert-danger alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button>Lien he admin de giai quyet</div>` })
                        } 
                        else {
                            res.render('login', { error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai tài khoản hoặc mật khẩu</div>" })
                        }
                        
                    }
                } else {
                    compare(req.body.password, docs[0].Password)
                        .then(check => {

                            if (check) {
                                User.updateOne({ Username: req.body.username }, { Unusual_login: 0,Status: req.cookies.status }, function() {})

                                req.session.Fullname = docs[0].Fullname
                                req.session.Phone_number = docs[0].Phone_number
                                req.session.Email = docs[0].Email
                                req.session.Password = docs[0].Password
                                req.session.Status =  req.cookies.status
                               
                                x = req.session
                               

                                if (docs[0].Status == 0) { res.redirect('/login1st') } else { res.redirect('/') }
                            } else {
                                let count = docs[0].Unusual_login + 1
                                User.updateOne({ Username: req.body.username }, { Unusual_login: count }, function() {})
                                if (count == 3) {
                                    User.updateOne({ Username: req.body.username }, { Status: -1 }, function() {
                                        console.log('saved')
                                    })
                                    res.cookie('check', 'lock', { expires: new Date(Date.now() + 60 * 1000) });
                                    res.cookie('st', docs[0].Status, { expires: new Date(Date.now() + 60 * 1000 * 60 * 7) });
                                    req.session.st = docs[0].Status
                                    res.render('login', { error: `<div class='alert alert-danger alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button>Wait for 5M to login again</div>` })
                                } 
                                else if(count>=6){
                                    User.updateOne({ Username: req.body.username }, { Status: -2 }, function() {
                                        console.log('saved')
                                    })
                                    res.cookie('check', 'lock', { expires: new Date(Date.now() + 60 * 1000) });
                                    res.cookie('st', 0, { expires: new Date(Date.now() + 60 * 1000 * 60 * 7) });
                                    req.session.st = 0
                                    res.render('login', { error: `<div class='alert alert-danger alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button>Lien he admin de giai quyet</div>` })
                                }
                                else {
                                    res.render('login', { error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai tài khoản hoặc mật khẩu</div>" })
                                }
                            }
                        })

                }
            }
        } else {
            res.render('login', { error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai tài khoản hoặc mật khẩu</div>" })
        }
    })
})

router.get('/register', function(req, res) {
    if (req.session.Phone_number) {
        return res.render('home', { status: req.session.Status,name: req.session.Fullname});
    }
    return res.redirect('/')
})

router.post('/register', function(req, res) {
    const form = new multiparty.Form()
    form.parse(req, (err, fields, files) => {
        if (err) return res.status(500).send(err.message)
        console.log('field data: ', fields)
        console.log('files: ', files)
        var username1 = checkUser()
        let username
        username1.then(function(result) {
            username = result // "initResolve"
            console.log(username)
            let pass = makepassword(6)
            let x = true
            User.find({ Phone_number: fields.phone[0] }, function(err, docs) {
                if (docs.length) {
                    let error = "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Phone number have been you</div>"
                    res.render('register', { error: error })
                } else {
                    User.find({ Email: fields.email[0] }, function(err, docs) {
                        if (docs.length) {
                            let error = "<div class='alert alert-danger'><center>Email have been you</center></div>"
                            res.render('register', { error: error })
                        } else {
                            var dir = "./src/public/upload/" + fields.phone[0] + '_' + fields.fullname[0]
                            if (!fs.existsSync(dir)) {
                                fs.mkdirSync(dir, { recursive: true });
                            }
                            var oldPath1 = files.photo[0].path;
                            let text1 = files.photo[0].originalFilename.split(".")
                            var newPath1 = dir + "\\front." + text1[1];
                            upload(oldPath1, newPath1);
                            var oldPath2 = files.photo2[0].path;
                            let text2 = files.photo2[0].originalFilename.split(".")
                            var newPath2 = dir + "\\back." + text2[1];
                            np1 = newPath1.split("/src")
                            np1x = "." + np1[1]
                            np2 = newPath2.split("/src")
                            np2x = "." + np2[1]
                            upload(oldPath2, newPath2);
                            let us = new User({
                                Phone_number: fields.phone[0],
                                Email: fields.email[0],
                                Fullname: fields.fullname[0],
                                BirthDay: fields.birthday[0],
                                Address: fields.add[0],
                                Ident_front: np1x,
                                Ident_back: np2x,
                                Username: username,
                                Password: pass
                            })
                            us.save(function(err, user) {
                                if (err) return console.error(1 + err);
                                console.log("Saved");
                                let x = "username: " + username + "\npassword: " + pass
                                var mailOptions = {
                                    from: 'anhq6009@gmail.com',
                                    to: fields.email[0],
                                    subject: 'Active your account',
                                    text: x + ""
                                };
                                transporter.sendMail(mailOptions, function(error, info) {
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        console.log('Email sent: ' + info.response);
                                    }
                                });
                                let alert = "<div class='bg-green-100 rounded-lg py-5 px-6 text-base text-green-700 mb-3 text-center' role='alert'>Đăng ký thành công, đăng nhập tại <a href='/login' class='font-bold text-green-800'>đây</a></div>"
                                res.render('register', { alert: alert })
                            })
                        }
                    })
                }

            })
        })
    })
})

router.get('/login1st', function(req, res) {
    if (req.session.Phone_number) {
        return res.render('login1st', { status: req.session.Status,name: req.session.Fullname});
    }
    return res.redirect('/')
});

router.post('/login1st', function(req, res) {
    if (req.body.password != req.body.password2) {
        res.render('login1st', { error: `<div class='alert alert-danger alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button>Không trùng khớp </div>` })
    } else {
        console.log(req.body.password, req.body.password2)
        bcrypt.hashSync(req.body.password, saltRounds, function(err, hash) {
            User.updateOne({ Phone_number: req.session.Phone_number }, { Password: hash, Status: 1 }, function() {
                console.log("User updated")
            })
            let wl = new Wallet({
                Phone_number: req.session.Phone_number,
            })
            wl.save(function(err, user) {
                if (err) return console.error(1 + err);
                console.log("Saved");
                let alert = "<div class='bg-green-100 rounded-lg py-5 px-6 text-base text-green-700 mb-3 text-center' role='alert'>Đăng ký thành công, đăng nhập tại <a href='/login' class='font-bold text-green-800'>đây</a></div>"
                res.redirect('/')
            })
            res.redirect('/')
                // Store hash in your password DB.
        });
        let secpass = hashpass(req.body.password)
        secpass.then(function(pass) {
            console.log(pass)
            User.updateOne({ Phone_number: req.session.Phone_number }, { Password: pass, Status: 1 }, function() {
                console.log("User updated")
            })
            let wl = new Wallet({
                Phone_number: req.session.Phone_number,
            })
            wl.save(function(err, user) {
                if (err) return console.error(1 + err);
                console.log("Saved");
                let alert = "<div class='bg-green-100 rounded-lg py-5 px-6 text-base text-green-700 mb-3 text-center' role='alert'>Đăng ký thành công, đăng nhập tại <a href='/login' class='font-bold text-green-800'>đây</a></div>"
                res.redirect('/')
            })
        })
    }
})

router.get('/profile', function(req, res) {
    let x = `<div class="text-sm" Chào ${req.session.Fullname} </div> <span><a href="/profile"><i name="user-icon" class="fa-solid fa-2x fa-user-lock pl-[10px]"></i></a></span>`
    let x1 = `<div class="text-sm" Chào ${req.session.Fullname} </div> <span><a href="/profile"><i class="fa-solid fa-2x fa-user pl-[10px]"></i></a></span>`
    if (!req.session.Phone_number) {
        return res.redirect('/login')
    } else {
        let u = get_user(req.session.Phone_number)
        u.then(function(us) {
                Wallet.find({ Phone_number: us[0].Phone_number }, function(err, docs) {
                    if (docs) {
                        if (us[0].Status == 2)
                            return res.render('profile', { status: req.session.Status, Full_name: us[0].Fullname, Birth: us[0].BirthDay, Phone_number: us[0].Phone_number, Email: us[0].Email, Address: us[0].Address, surplus: docs[0].Wallet_Surplus, status: "Đã active" });
                        else if (us[0].Status == 1) {
                            return res.render('profile', {  status: req.session.Status, Full_name: us[0].Fullname, Birth: us[0].BirthDay, Phone_number: us[0].Phone_number, Email: us[0].Email, Address: us[0].Address, surplus: docs[0].Wallet_Surplus, status: "Chưa active" });
                        } else if (us[0].Status == -1) {
                            return res.render('profile', {  status: req.session.Status, Full_name: us[0].Fullname, Birth: us[0].BirthDay, Phone_number: us[0].Phone_number, Email: us[0].Email, Address: us[0].Address, surplus: docs[0].Wallet_Surplus, status: "Tạm vô hiệu hóa" });
                        } else if (us[0].Status == -2) {
                            return res.render('profile', {  status: req.session.Status, Full_name: us[0].Fullname, Birth: us[0].BirthDay, Phone_number: us[0].Phone_number, Email: us[0].Email, Address: us[0].Address, surplus: docs[0].Wallet_Surplus, status: "Tạm bị khóa" });
                        }
                    } else {
                        return res.render('profile', { status: req.session.Status });
                    }
                })
            })
    }
});

router.get('/nap-tien', function(req, res) {
    let x = `<div class="text-sm">Chào ${req.session.Fullname} </div> <span><a href="/profile"><i name="user-icon" class="fa-solid fa-2x fa-user-lock pl-[10px]"></i></a></span>`
    let x1 = `<div class="text-sm">Chào ${req.session.Fullname} </div> <span><a href="/profile"><i class="fa-solid fa-2x fa-user pl-[10px]"></i></a></span>`
    let name = req.session.Fullname;
    if (!req.session.Phone_number) {
        return res.redirect('/login')
    } else {
        if (req.session.Status == 2) {
            return res.render('nap-tien', {status: req.session.Status, name: name });
        } else {
            return res.redirect('/')
        }
    }
});

router.post('/nap-tien', function(req, res) {
    let x = `Chào ${req.session.Fullname} <a href="/profile"><i name="user-icon" class="fa-solid fa-2x fa-user-lock"></i></a>`
    let x1 = `Chào ${req.session.Fullname} <a href="/profile"><i class="fa-solid fa-2x fa-user"></i></a>`
    console.log(req.body)
    let d = new Date()
    if (req.body.card_number == "111111") {
        if (req.body.end_date != "2022-10-10") {
            res.render('nap-tien', { name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai ngày</div>" })
        } else if (req.body.cvv != "411") {
            res.render('nap-tien', { name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai CVV</div>" })
        } else {
            Wallet.find({ Phone_number: req.session.Phone_number }, function(err, docs) {
                if (docs) {
                    Wallet.updateOne({ Phone_number: req.session.Phone_number }, { Wallet_Surplus: Number(docs[0].Wallet_Surplus) + Number(req.body.money_amount) }, function() {})
                    let tradeh = new H_trade({
                        ID: "NT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                        Phone_number: req.session.Phone_number,
                        Amount: Number(req.body.money_amount),
                        Type_trade: "nap tien"
                    })
                    tradeh.save(function(err, user) {
                        if (err) return console.error(1 + err);
                        console.log("Saved");
                    })
                }
                console.log(docs[0].Wallet_Surplus)

            })
            let alert = "<div class='bg-green-100 rounded-lg py-5 px-6 text-base text-green-700 mb-3 text-center' role='alert'>Thành công</div></div>"
            res.render('nap-tien', { name: req.session.Fullname, error: alert })
        }
    } else if (req.body.card_number == "222222") {
        if (req.body.end_date != "2022-11-11") {
            res.render('nap-tien', { status: req.session.Status,name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai ngày</div>" })
        } else if (req.body.cvv != "443") {
            res.render('nap-tien', {status: req.session.Status, name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai CVV</div>" })
        } else {
            if (Number(req.body.money_amount) > 1000000) {
                res.render('nap-tien', { status: req.session.Status,name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Chỉ nạp tối đa 1 triệu 1 lần</div>" })
            } else {
                Wallet.find({ Phone_number: req.session.Phone_number }, function(err, docs) {
                    if (docs) {
                        Wallet.updateOne({ Phone_number: req.session.Phone_number }, { Wallet_Surplus: docs[0].Wallet_Surplus + Number(req.body.money_amount) }, function() {})
                        let tradeh = new H_trade({
                            ID: "NT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                            Phone_number: req.session.Phone_number,
                            Amount: Number(req.body.money_amount),
                            Type_trade: "nap tien"
                        })
                        tradeh.save(function(err, user) {
                            if (err) return console.error(1 + err);
                            console.log("Saved");
                        })
                    }

                })
            }
            res.render('nap-tien', { status: req.session.Status,name: req.session.Fullname, error: "<div class='bg-green-100 rounded-lg py-5 px-6 text-base text-green-700 mb-3 text-center' role='alert'>Thành công</div></div>" })
        }
    } else if (req.body.card_number == "333333") {
        if (req.body.end_date != "2022-12-12") {
            res.render('nap-tien', { status: req.session.Status,name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai ngày</div>" })
        } else if (req.body.cvv != "577") {
            res.render('nap-tien', { status: req.session.Status,name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai CVV</div>" })
        } else {
            res.render('nap-tien', { status: req.session.Status,name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Thẻ hết tiền</div>" })
        }
    } else {
        res.render('nap-tien', { status: req.session.Status,name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Thẻ không hỗ trợ</div>" })
    }
})

router.get('/rut-tien', function(req, res) {
    let x = `Chào ${req.session.Fullname} <a href="/profile"><i name="user-icon" class="fa-solid fa-2x fa-user-lock"></i></a>`
    let x1 = `Chào ${req.session.Fullname} <a href="/profile"><i class="fa-solid fa-2x fa-user"></i></a>`
    let name = req.session.Fullname;
    Wallet.find({ Phone_number: req.session.Phone_number }, function(err, docs) {
        if (docs[0]) {
            let surplus = docs[0].Wallet_Surplus

            if (req.session.Status == 2) {
                return res.render('rut-tien', {status: req.session.Status, name: name, surplus: surplus });
            } else {
                return res.redirect('/')
            }
        } else {
            res.redirect('/login')
        }


    })

});

router.post('/rut-tien', function(req, res) {
    if (req.session.Status == 2) {
        let d = new Date();
        let da = d.getDate() + "/" + d.getMonth() + "/" + d.getFullYear()
        let che = check_date(req.session.Phone_number)
        console.log(123)
        console.log(che)
        che.then(function(resu) {
            console.log(1)
            console.log(resu)
            if (resu.length > 2) {
                res.render('rut-tien', { status: req.session.Status,name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Rút quá 2 lần 1 ngày</div>" })
            } else {

                Wallet.find({ Phone_number: req.session.Phone_number }, function(err, docs) {
                    let surplus = docs[0].Wallet_Surplus
                    if (Number(req.body.amount_money) > surplus) {
                        res.render('rut-tien', { status: req.session.Status,surplus: surplus, name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Số dư không đủ</div>" })
                    } else {
                        if (req.body.card_number == "111111") {
                            if (req.body.end_date != "2022-10-10") {
                                res.render('rut-tien', {status: req.session.Status, surplus: surplus, name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai ngày</div>" })
                            } else if (req.body.cvv != "411") {
                                res.render('rut-tien', {status: req.session.Status, surplus: surplus, name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai CVV</div>" })
                            } else {
                                Wallet.find({ Phone_number: req.session.Phone_number }, function(err, docs) {
                                    if (docs) {
                                        Wallet.updateOne({ Phone_number: req.session.Phone_number }, { Wallet_Surplus: docs[0].Wallet_Surplus - Number(req.body.amount_money) - Number(req.body.amount_money) * 5 / 100 }, function() {})
                                        if (Number(req.body.amount_money) > 5000000) {
                                            let tradeh = new H_trade({
                                                ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                                Phone_number: req.session.Phone_number,
                                                Amount: Number(req.body.amount_money),
                                                Type_trade: "rut tien",
                                                Status: 0
                                            })
                                            let withdraw = new withdraws({
                                                ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                                Phone_number: req.session.Phone_number,
                                                CardNumber: req.body.card_number,
                                                Amount: Number(req.body.amount_money),
                                                Note: req.body.note,
                                                Status: 0
                                            })
                                            tradeh.save(function(err, user) {
                                                if (err) return console.error(1 + err);
                                                console.log("Saved");
                                            })
                                            withdraw.save(function(err, user) {
                                                if (err) return console.error(1 + err);
                                                console.log("Saved");
                                            })
                                        } else {
                                            let tradeh = new H_trade({
                                                ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                                Phone_number: req.session.Phone_number,
                                                Amount: Number(req.body.amount_money),
                                                Type_trade: "rut tien",
                                            })
                                            let withdraw = new withdraws({
                                                ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                                Phone_number: req.session.Phone_number,
                                                CardNumber: req.body.card_number,
                                                Amount: Number(req.body.amount_money),
                                                Note: req.body.note,
                                                Status: 1
                                            })
                                            tradeh.save(function(err, user) {
                                                if (err) return console.error(1 + err);
                                                console.log("Saved");
                                            })
                                            withdraw.save(function(err, user) {
                                                if (err) return console.error(1 + err);
                                                console.log("Saved");
                                            })
                                        }
                                        res.render('rut-tien', { status: req.session.Status,name: req.session.Fullname, error: "<div class='bg-green-100 rounded-lg py-5 px-6 text-base text-green-700 mb-3 text-center' role='alert'>Thành công</div></div>" })
                                    }

                                })


                            }
                        } else if (req.body.card_number == "222222") {
                            if (req.body.end_date != "2022-11-11") {
                                res.render('rut-tien', { status: req.session.Status,surplus: surplus, name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai ngày</div>" })
                            } else if (req.body.cvv != "443") {
                                res.render('rut-tien', {  status: req.session.Status,surplus: surplus, name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai CVV</div>" })
                            } else {
                                Wallet.find({ Phone_number: req.session.Phone_number }, function(err, docs) {
                                    if (docs) {
                                        Wallet.updateOne({ Phone_number: req.session.Phone_number }, { Wallet_Surplus: docs[0].Wallet_Surplus - Number(req.body.amount_money) - Number(req.body.amount_money) * 5 / 100 }, function() {})
                                        if (Number(req.body.amount_money) > 5000000) {
                                            let tradeh = new H_trade({
                                                ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                                Phone_number: req.session.Phone_number,
                                                Amount: Number(req.body.amount_money),
                                                Type_trade: "rut tien",
                                                Status: 0
                                            })
                                            let withdraw = new withdraws({
                                                ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                                Phone_number: req.session.Phone_number,
                                                CardNumber: req.body.card_number,
                                                Amount: Number(req.body.amount_money),
                                                Note: req.body.note,
                                                Status: 0
                                            })
                                            tradeh.save(function(err, user) {
                                                if (err) return console.error(1 + err);
                                                console.log("Saved");
                                            })
                                            withdraw.save(function(err, user) {
                                                if (err) return console.error(1 + err);
                                                console.log("Saved");
                                            })
                                        } else {
                                            let tradeh = new H_trade({
                                                ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                                Phone_number: req.session.Phone_number,
                                                Amount: Number(req.body.amount_money),
                                                Type_trade: "rut tien",
                                            })
                                            let withdraw = new withdraws({
                                                ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                                Phone_number: req.session.Phone_number,
                                                CardNumber: req.body.card_number,
                                                Amount: Number(req.body.amount_money),
                                                Note: req.body.note,
                                                Status: 1
                                            })
                                            tradeh.save(function(err, user) {
                                                if (err) return console.error(1 + err);
                                                console.log("Saved");
                                            })
                                            withdraw.save(function(err, user) {
                                                if (err) return console.error(1 + err);
                                                console.log("Saved");
                                            })
                                        }
                                        res.render('rut-tien', { status: req.session.Status, name: req.session.Fullname, error: "<div class='bg-green-100 rounded-lg py-5 px-6 text-base text-green-700 mb-3 text-center' role='alert'>Thành công</div></div>" })
                                    }

                                })


                            }
                        } else if (req.body.card_number == "333333") {
                            if (req.body.end_date != "2022-12-12") {
                                res.render('rut-tien', { status: req.session.Status, surplus: surplus, name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai ngày</div>" })
                            } else if (req.body.cvv != "577") {
                                res.render('rut-tien', {  status: req.session.Status,surplus: surplus, name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai CVV</div>" })
                            } else {
                                Wallet.find({ Phone_number: req.session.Phone_number }, function(err, docs) {
                                    if (docs) {
                                        Wallet.updateOne({ Phone_number: req.session.Phone_number }, { Wallet_Surplus: docs[0].Wallet_Surplus - Number(req.body.amount_money) - Number(req.body.amount_money) * 5 / 100 }, function() {})
                                        if (Number(req.body.amount_money) > 5000000) {
                                            let tradeh = new H_trade({
                                                ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                                Phone_number: req.session.Phone_number,
                                                Amount: Number(req.body.amount_money),
                                                Type_trade: "rut tien",
                                                Status: 0
                                            })
                                            let withdraw = new withdraws({
                                                ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                                Phone_number: req.session.Phone_number,
                                                CardNumber: req.body.card_number,
                                                Amount: Number(req.body.amount_money),
                                                Note: req.body.note,
                                                Status: 0
                                            })
                                            tradeh.save(function(err, user) {
                                                if (err) return console.error(1 + err);
                                                console.log("Saved");
                                            })
                                            withdraw.save(function(err, user) {
                                                if (err) return console.error(1 + err);
                                                console.log("Saved");
                                            })
                                        } else {
                                            let tradeh = new H_trade({
                                                ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                                Phone_number: req.session.Phone_number,
                                                Amount: Number(req.body.amount_money),
                                                Type_trade: "rut tien",
                                            })
                                            let withdraw = new withdraws({
                                                ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                                Phone_number: req.session.Phone_number,
                                                CardNumber: req.body.card_number,
                                                Amount: Number(req.body.amount_money),
                                                Note: req.body.note,
                                                Status: 1
                                            })
                                            tradeh.save(function(err, user) {
                                                if (err) return console.error(1 + err);
                                                console.log("Saved");
                                            })
                                            withdraw.save(function(err, user) {
                                                if (err) return console.error(1 + err);
                                                console.log("Saved");
                                            })
                                        }
                                        res.render('rut-tien', {  status: req.session.Status,name: req.session.Fullname, error: "<div class='bg-green-100 rounded-lg py-5 px-6 text-base text-green-700 mb-3 text-center' role='alert'>Thành công</div></div>" })
                                    }

                                })


                            }
                        } else {
                            res.render('rut-tien', { surplus: surplus, name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Thẻ không hỗ trợ</div>" })
                        }
                    }
                })
            }
        })
    } else {
        res.redirect('/');
    }

})

router.get('/chuyen-tien', function(req, res) {
    let x = `<div class="text-sm">Chào ${req.session.Fullname} </div> <span><a href="/profile"><i name="user-icon" class="fa-solid fa-2x fa-user-lock pl-[10px]"></i></a></span>`
    let x1 = `<div class="text-sm">Chào ${req.session.Fullname} </div> <span><a href="/profile"><i class="fa-solid fa-2x fa-user pl-[10px]"></i></a></span>`
    if (req.session.Phone_number)
        if (req.session.Status == 2)
            res.render('chuyen-tien', { status: req.session.Status,  name: req.session.Fullname })
        else
            res.redirect('/')
    else {
        return res.redirect('/')
    }
})

router.post('/chuyen-tien', function(req, res) {
    let x = `Chào ${req.session.Fullname} <a href="/profile"><i name="user-icon" class="fa-solid fa-2x fa-user-lock"></i></a>`
    let x1 = `Chào ${req.session.Fullname} <a href="/profile"><i class="fa-solid fa-2x fa-user"></i></a>`
    let name = req.session.Fullname;
    
    let u= get_user(req.body.Phone_number_rec)
    u.then(function(up){
        if(up){
            if (req.session.Status == 2) {
                Wallet.find({ Phone_number: req.session.Phone_number }, function(err, docs) {
                    if (docs) {
                        if (Number(req.body.amount_money) > Number(docs[0].Wallet_Surplus)) {
                            console.log("het tien")
                            res.render('chuyen-tien', {  status: req.session.Status, surplus: surplus, name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Số dư không đủ</div>" })
                        } else {
                            console.log("con tien")
                            let x = get_user_surplus(req.body.phone_send)
                            x.then(function(x1) {
                                console.log(x1)
                                Wallet.updateOne({ Phone_number: req.session.Phone_number }, { Wallet_Surplus: docs[0].Wallet_Surplus - Number(req.body.amount_money) - Number(req.body.amount_money) * 5 / 100 }, function() {})
                                    // Wallet.updateOne({ Phone_number: req.session.phone_rc }, { Wallet_Surplus: docs[0].Wallet_Surplus - Number(req.body.amount_money)-Number(req.body.amount_money)*5/100}, function () { })
                                if (Number(req.body.amount_money) > 5000000) {
                                    let tradeh = new H_trade({
                                        ID: "CT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                        Phone_number: req.session.Phone_number,
                                        Amount: Number(req.body.amount_money),
                                        Type_trade: "chuyen tien",
                                        Status: 0
                                    })
                                    let tranfer = new tranfers({
                                        ID: "CT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                        Phone_number: req.session.Phone_number,
                                        Phone_number_rec: req.body.phone_send,
                                        Amount: Number(req.body.amount_money),
                                        Note: req.body.note,
                                        Status: 0
                                    })
                                    tradeh.save(function(err, user) {
                                        if (err) return console.error(1 + err);
                                        console.log("Saved");
                                    })
                                    tranfer.save(function(err, user) {
                                        if (err) return console.error(1 + err);
                                        console.log("Saved");
                                    })
                                } else {
                                    console.log(x1[0])
                                    console.log(req.body.amount_money)
                                    let money = Number(x1[0].Wallet_Surplus) + Number(req.body.amount_money)
                                    console.log(money)
                                    Wallet.updateOne({ Phone_number: req.body.phone_send }, { Wallet_Surplus: money }, function() { console.log(1) })
                                    let tradeh = new H_trade({
                                        ID: "CT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                        Phone_number: req.session.Phone_number,
                                        Amount: Number(req.body.amount_money),
                                        Type_trade: "chuyen tien",
                                        Status: 1
                                    })
                                    let tranfer = new tranfers({
                                        ID: "CT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                        Phone_number: req.session.Phone_number,
                                        Phone_number_rec: req.body.phone_send,
                                        Amount: Number(req.body.amount_money),
                                        Note: req.body.note,
                                        Status: 1
                                    })
                                    tradeh.save(function(err, user) {
                                        if (err) return console.error(1 + err);
                                        console.log("Saved");
                                    })
                                    tranfer.save(function(err, user) {
                                        if (err) return console.error(1 + err);
                                        console.log("Saved");
                                    })
                                    sendEmail(req.body.phone_send,req.session.Phone_number,Number(req.body.amount_money),req.body.note);
                                }
                                res.render('chuyen-tien', {  status: req.session.Status,name: req.session.Fullname, error: "<div class='bg-green-100 rounded-lg py-5 px-6 text-base text-green-700 mb-3 text-center' role='alert'>Thành công</div></div>" })
                            })
                        }
                    }
                })
            } else {
                return res.render('chuyen-tien', {  status: req.session.Status, });
            }
        }else{
            return res.render('chuyen-tien', { status: req.session.Status, surplus: surplus, name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Số điện thoại không tồn tại</div>" })

        }
    })
    

})

router.get('/transaction-history', function(req, res) {
    let x = `<div class="text-sm">Chào ${req.session.Fullname} </div> <span><a href="/profile"><i name="user-icon" class="fa-solid fa-2x fa-user-lock pl-[10px]"></i></a></span>`
    let x1 = `<div class="text-sm">Chào ${req.session.Fullname} </div> <span><a href="/profile"><i class="fa-solid fa-2x fa-user pl-[10px]"></i></a></span>`
    if (req.session.Phone_number) {
        let t = ``
        H_trade.find({ Phone_number: req.session.Phone_number }, function(err, docs) {
            console.log(docs);
            console.log(docs.length);
            for (let i = docs.length - 1; i >= 0; i--) {
                let s;
                if (docs[i].Status) {
                    s = "Thành công"
                } else if (docs[i].Status == -1) {
                    s = "Thất bại"
                } else {
                    s = "Đang xử lý"
                }
                t += `<form method="get" action="chi-tiet/${docs[i].ID}">
                <tr class="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${docs[i].ID}</td>
                <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                ${docs[i].Date}
                </td>
                <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                ${docs[i].Type_trade}   
                </td>
                <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                ${currencyFormatter.format(docs[i].Amount, { code: 'VND' })}
                </td>
                <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                    ${s}
                </td>
                <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                    <button type="submit">Xem chi tiết giao dịch</button>
                </td>
    </tr></form>`
            }

            return res.render('transaction-history', { status: req.session.Status, tr: t });
        })
    } else {
        res.redirect('/')
    }

})
router.get('/chi-tiet/:id',function(req, res){
    console.log(req.params.id)
    let trade=get_h_trade(req.params.id)
    let t=""
    trade.then(function(tra){
        if(tra[0].Status==1){
            t="Thành công"
        }else if(tra[0].Status==-1){
            t="Thất bại"
        }else{
            t="Đang được xét duyệt"
        }
        if(tra[0].Type_trade=="nap tien"){
            res.render('transaction-details',{id:tra[0].ID,type:tra[0].Type_trade,Status:t,Date:tra[0].Date,money:tra[0].Amount,fee:0})

        }else if(tra[0].Type_trade=="rut tien"){
            withdraws.find({ID:tra[0].ID},function(err,docs){
                if(docs){
                    let m=` <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[30px]">Thẻ nhận </div>
                    <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[100px] lg:col-span-2 ">${docs[0].CardNumber}</div>
                    <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[30px]">Lời nhắn</div>
                    <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[100px] lg:col-span-2 ">${docs[0].Note}</div>`
                    let fee=tra[0].Amount*5/100
                    res.render('transaction-details',{ status: req.session.Status,id:tra[0].ID,type:tra[0].Type_trade,Status:t,Date:tra[0].Date,money:tra[0].Amount,fee:fee,message:m})
                }
            })
        }else if(tra[0].Type_trade=="chuyen tien"){
            tranfers.find({ID:tra[0].ID},function(err,docs){
                if(docs){
                    let m=` <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[30px]">Số điện thoại nhận</div>
                    <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[100px] lg:col-span-2 ">${docs[0].Phone_number_rec}</div>
                    <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[30px]">Lời nhắn</div>
                    <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[100px] lg:col-span-2 ">${docs[0].Note}</div>`
                    let fee=tra[0].Amount*5/100
                    res.render('transaction-details',{ status: req.session.Status,id:tra[0].ID,type:tra[0].Type_trade,Status:t,Date:tra[0].Date,money:tra[0].Amount,fee:fee,message:m})
                }
            })
        }else if(tra[0].Type_trade=="mua card"){
            card.find({ID:tra[0].ID},function(err,docs){
                if(docs){
                    let m=` <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[30px]">Số điện thoại nhận</div>
                    <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[100px] lg:col-span-2 ">${docs[0].Phone_number_rec}</div>
                    <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[30px]">Lời nhắn</div>
                    <div class="py-[15px] lg:py-[25px] pl-[10px] lg:pl-[100px] lg:col-span-2 ">${docs[0].Note}</div>`
                    // let fee=tra[0].Amount*5/100
                    let str=""
                    if (docs[0].Card_number.slice(0,5) == "11111") {
                        str = "Viettel"
                    } else if (docs[0].Card_number.slice(0,5) == "22222") {
                        str = "Mobifone"
                    } else if (docs[0].Card_number.slice(0,5) == "33333") {
                        str = "Vinaphone"
                    }
                    let x=`<div class="flex pl-[15px] lg:pl-0 text-xs lg:text-2xl basis-1/2 py-[10px]">1111111</div>
                    <div class="flex pl-[15px] lg:pl-0 text-xs lg:text-2xl basis-1/2 py-[10px]">2222222</div>
                    <div class="flex pl-[15px] lg:pl-0 text-xs lg:text-2xl basis-1/2 py-[10px]">3333333</div>
                    <div class="flex pl-[15px] lg:pl-0 text-xs lg:text-2xl basis-1/2 py-[10px]">4444444</div>`
                    let ca=""
                    let temp1=docs[0].Card_number
                    console.log(str)
                    let temp=temp1.split("/")
                    for(let i=0;i<temp.length;i++){
                        ca+=`<div class="flex pl-[15px] lg:pl-0 text-xs lg:text-2xl basis-1/2 py-[10px]">${temp[i]}</div>`
                    }
                    res.render('listOfCards',{ status: req.session.Status,type:str,price:docs[0].Price,Date:tra[0].Date,card:ca})
                }
            })
        }
    })
    
   
    
})
router.get('/mua-card', function(req, res) {
    let x = `<div class="text-sm">Chào ${req.session.Fullname} </div> <span><a href="/profile"><i name="user-icon" class="fa-solid fa-2x fa-user-lock pl-[10px]"></i></a></span>`
    let x1 = `<div class="text-sm">Chào ${req.session.Fullname} </div> <span><a href="/profile"><i class="fa-solid fa-2x fa-user pl-[10px]"></i></a></span>`
    if (req.session.Phone_number) {
        if (req.session.Status == 2)
            return res.render('mua-card', {  status: req.session.Status, phone: req.session.Phone_number });
        else
            res.redirect('/')
    } else { res.redirect('/') }

})

router.post('/mua-card', function(req, res) {
    if (req.session.Phone_number) {
        if (req.body.amount > 5) {
            res.render('mua-card', { status: req.session.Status, phone: req.session.Phone_number, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Chỉ mua tối đa 5 card 1 lúc</div>" })
        } else if (req.body.amount <= 0) {
            res.render('mua-card', { status: req.session.Status, phone: req.session.Phone_number, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Số lượng không hợp lệ</div>" })

        } else {
            let x = get_user_surplus(req.session.Phone_number)
            x.then(function(x1) {
                if (x1.Wallet_Surplus < Number(req.body.price) * Number(req.body.amount)) {
                    res.render('mua-card', { status: req.session.Status, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Bạn ko đủ tiền</div>" })
                } else {
                    Wallet.updateOne({ Phone_number: req.session.Phone_number }, { Wallet_Surplus: x1.Wallet_Surplus - Number(req.body.price) * Number(req.body.amount) }, function() {})
                    let tradeh = new H_trade({
                        ID: "MC" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                        Phone_number: req.session.Phone_number,
                        Amount: Number(req.body.price) * Number(req.body.amount),
                        Type_trade: "mua card",
                        Status: 1
                    })
                    tradeh.save(function(err, user) {
                        if (err) return console.error(1 + err);
                        console.log("Saved");
                    })
                    let str;
                    if (req.body.typec == "Viettel") {
                        str = "11111"
                    } else if (req.body.typec == "Mobifone") {
                        str = "22222"
                    } else if (req.body.typec == "Vinaphone") {
                        str = "33333"
                    }
                    let str1 = ""
                    let t1 = ""
                    for (let i = 0; i < req.body.amount; i++) {
                        let num = i + 1
                        let temp = str + makecard(5)
                        t1 += temp + "/"
                        str1 += `<div class='bg-green-100 rounded-lg py-5 px-6 text-base text-green-700 mb-3 text-center' role='alert'>Card ${i+1} : ${temp}</div>`
                    }
                    console.log(t1)
                    let c = new card({
                        ID: "MC" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                        Phone_number: req.session.Phone_number,
                        Price: req.body.price,
                        Card_number: t1,
                    })
                    c.save(function(err, user) {
                        if (err) return console.error(1 + err);
                        console.log("Saved");
                    })
                    res.render("mua-card", {  status: req.session.Status,phone: req.session.Phone_number, error: str1 })
                }
            })

        }
    } else {
        res.redirect('/')
    }
    console.log(req.body)
})

router.get('/transaction-details', function(req, res) {
    return res.render('transaction-details')
})

router.get('/listOfCards', function(req, res) {
    let x="3333394280"
    console.log(x.slice(0,5))
    let y="3333394280/3333377994/3333370516/3333335687/3333335187/"
    let y1=y.split("/")
    console.log(y1)
    console.log(y1.length)
    return res.render('listOfCards')
})

router.get('/forgotPassword', function(req, res) {
    return res.render('forgotPassword')
})

router.get('/logout', (req, res) => {
    req.session.destroy(function(err) {
        res.redirect('/login'); //Inside a callback… bulletproof!
    });
})

module.exports = router;