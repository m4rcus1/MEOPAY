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
const tranfers = require("../models/tranfers");
const mongoose = require("mongoose")

db = require("../lib/db")
const urlencodedParser = bodyParser.urlencoded({ extended: false });

//session
router.use(session({
    secret: 'keyboard cat',
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false
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
    mv(oldPath, newPath, function (err) {
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
            return new Promise(function (res, rej) {
                res(username);
            })
        }
    }
    return new Promise(function (res, rej) {
        res(username);
    })

}


async function check_date(phone) {
    let check = false
    let d = new Date();
    let da = d.getDate() + "/" + d.getMonth() + "/" + d.getFullYear()

    let x = await H_trade.find({ Phone_number: phone, Type_trade: "rut tien" , Date:da},
        
    )
    return new Promise(function (res, rej) {
        res(x);
    })
}
async function get_user(phone){
    let x=await User.find({ Phone_number: phone});
    return new Promise(function (res, rej) {
        res(x)
    })
}

router.get('/', function (req, res) {
    let x = `<div class="text-sm"> Chào ${req.session.Fullname} </div> <span><a href="/profile"><i name="user-icon" class="fa-solid fa-2x fa-user-lock pl-[10px]"></i></a></span>`
    let x1 = `<div class="text-sm"> Chào ${req.session.Fullname} </div> <span><a href="/profile"><i class="fa-solid fa-2x fa-user pl-[10px]"></i></a></span>`
    let y = `  <a href="/register"><button class="loginBtn">Đăng Ký</button></a>
    <a href="/login"><button class="registerBtn">Đăng Nhập</button></a>`
    if (req.session.Phone_number) {
        if (req.session.Status <= 1)
            return res.render('home', { x: x1 });
        else {
            return res.render('home', { x: x })
        }
    }
    return res.render('home', { x: y })
})

router.get('/login', function (req, res) {
    if (req.session.Phone_number) {
        return res.redirect('/')
    }

    let y = `<a href="/register"><button class="loginBtn">Đăng Ký</button></a>
    <a href="/login"><button class="registerBtn">Đăng Nhập</button></a>`
    return res.render('login', { x: y });
})

router.post('/login', urlencodedParser, function (req, res) {
    User.find({ Username: req.body.username }, function (err, docs) {
        if (docs.length) {
            console.log(req.cookies.check)
            if (req.cookies.check == 'lock') {
                User.updateOne({ Username: req.body.username }, { Unusual_login: 0 }, function () { })
                res.render('login', { error: `<div class='alert alert-danger alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button>Wait for 5M to login again</div>` })
            } else {
                console.log(docs)
                console.log(req.body)
                let check_ux = false
                console.log(docs[0])
                if (docs[0].Status == 0) {
                    if (docs[0].Password == req.body.password) {
                        req.session.Fullname = docs[0].Fullname
                        req.session.Phone_number = docs[0].Phone_number
                        req.session.Email = docs[0].Email
                        req.session.Password = docs[0].Password
                        req.session.Status = docs[0].Status
                        x = req.session
                        User.updateOne({ Username: req.body.username }, { Unusual_login: 0 }, function () { })
                        if (docs[0].Status == 0) { res.redirect('/login1st') } else { res.redirect('/') }
                    } else {
                        let count = docs[0].Unusual_login + 1
                        User.updateOne({ Username: req.body.username }, { Unusual_login: count }, function () { })
                        if (count > 3) {
                            res.cookie('check', 'lock', { expires: new Date(Date.now() + 60 * 1000) });
                            res.render('login', { error: `<div class='alert alert-danger alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button>Wait for 5M to login again</div>` })
                        } else {
                            res.render('login', { error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai tài khoản hoặc mật khẩu</div>" })
                        }
                    }
                } else {
                    compare(req.body.password, docs[0].Password)
                        .then(check => {
                            console.log(check)
                            if (check) {
                                req.session.Fullname = docs[0].Fullname
                                req.session.Phone_number = docs[0].Phone_number
                                req.session.Email = docs[0].Email
                                req.session.Password = docs[0].Password
                                req.session.Status = docs[0].Status
                                x = req.session
                                User.updateOne({ Username: req.body.username }, { Unusual_login: 0 }, function () { })
                                if (docs[0].Status == 0) { res.redirect('/login1st') } else { res.redirect('/') }
                            } else {
                                let count = docs[0].Unusual_login + 1
                                User.updateOne({ Username: req.body.username }, { Unusual_login: count }, function () { })
                                if (count > 3) {
                                    res.cookie('check', 'lock', { expires: new Date(Date.now() + 60 * 1000) });
                                    res.render('login', { error: `<div class='alert alert-danger alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button>Wait for 5M to login again</div>` })
                                } else {
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

router.get('/register', function (req, res) {
    if (req.session.Phone_number) {
        return res.redirect('/')
    }
    let y = `<a href="/register"><button class="loginBtn">Đăng Ký</button></a>
    <a href="/login"><button class="registerBtn">Đăng Nhập</button></a>`
    return res.render('register', { x: y });
})

router.post('/register', function (req, res) {
    const form = new multiparty.Form()
    form.parse(req, (err, fields, files) => {
        if (err) return res.status(500).send(err.message)
        console.log('field data: ', fields)
        console.log('files: ', files)
        var username1 = checkUser()
        let username
        username1.then(function (result) {
            username = result // "initResolve"
            console.log(username)
            let pass = makepassword(6)
            let x = true
            User.find({ Phone_number: fields.phone[0] }, function (err, docs) {
                if (docs.length) {
                    let error = "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Phone number have been you</div>"
                    res.render('register', { error: error })
                } else {
                    User.find({ Email: fields.email[0] }, function (err, docs) {
                        if (docs.length) {
                            let error = "<div class='alert alert-danger'><center>Email have been you</center></div>"
                            res.render('register', { error: error })
                        } else {
                            var dir = "./src/public/upload/" + fields.phone[0] + '_' + fields.fullname[0]
                            if (!fs.existsSync(dir)) {
                                fs.mkdirSync(dir, { recursive: true });
                            }
                            var oldPath1 = files.photo[0].path;
                            var newPath1 = dir + "\\front" + files.photo[0].originalFilename;
                            upload(oldPath1, newPath1);
                            var oldPath2 = files.photo2[0].path;
                            var newPath2 = dir + "\\back" + files.photo2[0].originalFilename;
                            upload(oldPath2, newPath2);
                            let us = new User({
                                Phone_number: fields.phone[0],
                                Email: fields.email[0],
                                Fullname: fields.fullname[0],
                                BirthDay: fields.birthday[0],
                                Address: fields.add[0],
                                Ident_front: newPath1,
                                Ident_back: newPath2,
                                Username: username,
                                Password: pass
                            })
                            us.save(function (err, user) {
                                if (err) return console.error(1 + err);
                                console.log("Saved");
                                let x = "username: " + username + "\npassword: " + pass
                                var mailOptions = {
                                    from: 'anhq6009@gmail.com',
                                    to: fields.email[0],
                                    subject: 'Active your account',
                                    text: x + ""
                                };
                                transporter.sendMail(mailOptions, function (error, info) {
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

router.get('/login1st', function (req, res) {
    if (!req.session.Status) {
        return res.redirect('/login');
    } else if (req.session.Status == 1) {
        return res.redirect('/')
    }
    let y = `  <a href="/register"><button class="loginBtn">Đăng Ký</button></a>
    <a href="/login"><button class="registerBtn">Đăng Nhập</button></a>`
    return res.render('login1st', { x: y });
});

router.post('/login1st', function (req, res) {
    if (req.body.password != req.body.password2) {
        res.render('login1st', { error: `<div class='alert alert-danger alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button>Không trùng khớp </div>` })
    } else {
        console.log(req.body.password, req.body.password2)
        bcrypt.hashSync(req.body.password, saltRounds, function (err, hash) {
            console.log(hash)
            User.updateOne({ Phone_number: req.session.Phone_number }, { Password: hash, Status: 1 }, function () {
                console.log("User updated")
            })
            let wl = new Wallet({
                Phone_number: req.session.Phone_number,
            })
            wl.save(function (err, user) {
                if (err) return console.error(1 + err);
                console.log("Saved");
                let alert = "<div class='bg-green-100 rounded-lg py-5 px-6 text-base text-green-700 mb-3 text-center' role='alert'>Đăng ký thành công, đăng nhập tại <a href='/login' class='font-bold text-green-800'>đây</a></div>"
                res.redirect('/')
            })
            res.redirect('/')
            // Store hash in your password DB.
        });


    }
})

router.get('/profile', function (req, res) {
    let x = `<div class="text-sm" Chào ${req.session.Fullname} </div> <span><a href="/profile"><i name="user-icon" class="fa-solid fa-2x fa-user-lock pl-[10px]"></i></a></span>`
    let x1 = `<div class="text-sm" Chào ${req.session.Fullname} </div> <span><a href="/profile"><i class="fa-solid fa-2x fa-user pl-[10px]"></i></a></span>`
    if (!req.session.Phone_number) {
        return res.redirect('/login')
    } else {
        let u=get_user(req.session.Phone_number)
            u.then(function (us){
                console.log(us)
                console.log(us[0].Phone_number)
                if(us[0].Status==1){
                    Wallet.find({Phone_number:us[0].Phone_number},function(err, docs){
                        if(docs){
                            console.log(docs[0])
                            return res.render('profile', { x: x1,Full_name:us[0].Fullname,Birth:us[0].BirthDay,Phone_number:us[0].Phone_number,Email:us[0].Email,Address:us[0].Address,surplus:docs[0].Wallet_Surplus,status:"Chưa được active" });
                        }else{
                            return res.render('profile', { x: x1 });
                        }
                    })
                }else{
                    Wallet.find({Phone_number:us[0].Phone_number},function(err, docs){
                        if(docs){
                            console.log(docs[0])
                            return res.render('profile', { x: x1,Full_name:us[0].Fullname,Birth:us[0].BirthDay,Phone_number:us[0].Phone_number,Email:us[0].Email,Address:us[0].Address,surplus:docs[0].Wallet_Surplus,status:"Đã active" });
                        }else{
                            return res.render('profile', { x: x1 });
                        }
                    })
                }
                
            })
        if (req.session.Status <= 1) {
            
           
        } else {
            u.then(function (us){
                console.log(us)
                console.log(us[0].Phone_number)
                Wallet.find({Phone_number:us[0].Phone_number},function(err, docs){
                    if(docs){
                        return res.render('profile', { x: x1,Full_name:us[0].Fullname,Birth:us[0].BirthDay,Phone_number:us[0].Phone_number,Email:us[0].Email,Address:us[0].Address,surplus:docs[0].Wallet_surplus,status:us[0].Status });
                    }else{
                        return res.render('profile', { x: x1 });
                    }
                })
            })
            return res.render('profile', { x: x })
        }
    }
});
router.get('/nap-tien', function (req, res) {
    let x = `<div class="text-sm" Chào ${req.session.Fullname} </div> <span><a href="/profile"><i name="user-icon" class="fa-solid fa-2x fa-user-lock pl-[10px]"></i></a></span>`
    let x1 = `<div class="text-sm" Chào ${req.session.Fullname} </div> <span><a href="/profile"><i class="fa-solid fa-2x fa-user pl-[10px]"></i></a></span>`
    let name = req.session.Fullname;
    if (!req.session.Phone_number) {
        return res.redirect('/login')
    } else {
        if (req.session.Status <= 1) {
            return res.render('nap-tien', { x: x1, name: name });
        } else {
            return res.render('nap-tien', { x: x, name: name })
        }
    }
});

router.post('/nap-tien', function (req, res) {
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
            Wallet.find({ Phone_number: req.session.Phone_number }, function (err, docs) {
                if (docs) {
                    Wallet.updateOne({ Phone_number: req.session.Phone_number }, { Wallet_Surplus: Number(docs[0].Wallet_Surplus) + Number(req.body.money_amount) }, function () { })
                    let tradeh = new H_trade({
                        ID: "NT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                        Phone_number: req.session.Phone_number,
                        Amount: Number(req.body.money_amount),
                        Type_trade: "nap tien"
                    })
                    tradeh.save(function (err, user) {
                        if (err) return console.error(1 + err);
                        console.log("Saved");
                    })
                }
                console.log(docs[0].Wallet_Surplus)

            })
            res.render('nap-tien', { name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Thành công</div>" })
        }
    } else if (req.body.card_number == "222222") {
        if (req.body.end_date != "2022-11-11") {
            res.render('nap-tien', { name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai ngày</div>" })
        } else if (req.body.cvv != "443") {
            res.render('nap-tien', { name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai CVV</div>" })
        } else {
            if (Number(req.body.money_amount) > 1000000) {
                res.render('nap-tien', { name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Chỉ nạp tối đa 1 triệu 1 lần</div>" })
            } else {
                Wallet.find({ Phone_number: req.session.Phone_number }, function (err, docs) {
                    if (docs) {
                        Wallet.updateOne({ Phone_number: req.session.Phone_number }, { Wallet_Surplus: docs[0].Wallet_Surplus + Number(req.body.money_amount) }, function () { })
                        let tradeh = new H_trade({
                            ID: "NT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                            Phone_number: req.session.Phone_number,
                            Amount: Number(req.body.money_amount),
                            Type_trade: "nap tien"
                        })
                        tradeh.save(function (err, user) {
                            if (err) return console.error(1 + err);
                            console.log("Saved");
                        })
                    }

                })
            }
            res.render('nap-tien', { name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Thành công</div>" })
        }
    } else if (req.body.card_number == "333333") {
        if (req.body.end_date != "2022-12-12") {
            res.render('nap-tien', { name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai ngày</div>" })
        } else if (req.body.cvv != "577") {
            res.render('nap-tien', { name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai CVV</div>" })
        } else {
            res.render('nap-tien', { name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Thẻ hết tiền</div>" })
        }
    } else {
        res.render('nap-tien', { name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Thẻ không hỗ trợ</div>" })
    }
    // Wallet.find({Phone_number: req.session.Phone_number }, function(err,docs){
    //     Wallet.updateOne({ Phone_number: req.session.Phone_number }, {Wallet_Surplus:docs[0].Wallet_Surplus+Number(req.body.money_amount)}, function(){})
    // })

    // res.redirect('/nap-tien')
})

router.get('/rut-tien', function (req, res) {
    let x = `Chào ${req.session.Fullname} <a href="/profile"><i name="user-icon" class="fa-solid fa-2x fa-user-lock"></i></a>`
    let x1 = `Chào ${req.session.Fullname} <a href="/profile"><i class="fa-solid fa-2x fa-user"></i></a>`
    let name = req.session.Fullname;
    Wallet.find({ Phone_number: req.session.Phone_number }, function (err, docs) {
        if (docs[0]) {
            let surplus = docs[0].Wallet_Surplus

            if (req.session.Status <= 1) {
                return res.render('rut-tien', { x: x1, name: name, surplus: surplus });
            } else {
                return res.render('rut-tien', { x: x, name: name, surplus: surplus });
            }
        } else {
            res.redirect('/login')
        }


    })

});

router.post('/rut-tien', function (req, res) {
    if(req.session.Status==1){
    let d = new Date();
    let da = d.getDate() + "/" + d.getMonth() + "/" + d.getFullYear()
    let che=check_date('0562413183')
    console.log(123)
    console.log(che)
    che.then(function (resu) {
        console.log(1)
        console.log(resu)
        if (resu.length > 2) {
            res.render('rut-tien', { name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Rút quá 2 lần 1 ngày</div>" })
        }
        else {
            
            Wallet.find({ Phone_number: req.session.Phone_number }, function (err, docs) {
                let surplus = docs[0].Wallet_Surplus
                if (Number(req.body.amount_money) > surplus) {
                    res.render('rut-tien', { surplus: surplus, name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Số dư không đủ</div>" })
                } else {
                    if (req.body.card_number == "111111") {
                        if (req.body.end_date != "2022-10-10") {
                            res.render('rut-tien', { surplus: surplus,name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai ngày</div>" })
                        } else if (req.body.cvv != "411") {
                            res.render('rut-tien', { surplus: surplus,name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai CVV</div>" })
                        } else {
                            Wallet.find({ Phone_number: req.session.Phone_number }, function (err, docs) {
                                if (docs) {
                                    Wallet.updateOne({ Phone_number: req.session.Phone_number }, { Wallet_Surplus: docs[0].Wallet_Surplus - Number(req.body.amount_money) }, function () {})
                                    if (Number(req.body.amount_money) > 5000000) {
                                        let tradeh = new H_trade({
                                            ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                            Phone_number: req.session.Phone_number,
                                            Amount: Number(req.body.amount_money),
                                            Type_trade: "rut tien",
                                            Status: 0
                                        })
                                        let tranfer = new tranfers({
                                            ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                            Phone_number: req.session.Phone_number,
                                            CardNumber: req.body.card_number,
                                            Amount: Number(req.body.amount_money),
                                            Note: req.body.note,
                                            Status: 0
                                        })
                                        tradeh.save(function (err, user) {
                                            if (err) return console.error(1 + err);
                                            console.log("Saved");
                                        })
                                        tranfer.save(function (err, user) {
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
                                        let tranfer = new tranfers({
                                            ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                            Phone_number: req.session.Phone_number,
                                            CardNumber: req.body.card_number,
                                            Amount: Number(req.body.amount_money),
                                            Note: req.body.note,
                                            Status: 1
                                        })
                                        tradeh.save(function (err, user) {
                                            if (err) return console.error(1 + err);
                                            console.log("Saved");
                                        })
                                        tranfer.save(function (err, user) {
                                            if (err) return console.error(1 + err);
                                            console.log("Saved");
                                        })
                                    }
                                    res.render('rut-tien', { name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Thành công</div>" })
                                }

                            })


                        }
                    }
                    else if (req.body.card_number == "222222") {
                        if (req.body.end_date != "2022-11-11") {
                            res.render('rut-tien', { surplus: surplus,name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai ngày</div>" })
                        } else if (req.body.cvv != "443") {
                            res.render('rut-tien', { surplus: surplus,name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai CVV</div>" })
                        } else {
                            Wallet.find({ Phone_number: req.session.Phone_number }, function (err, docs) {
                                if (docs) {
                                    Wallet.updateOne({ Phone_number: req.session.Phone_number }, { Wallet_Surplus: docs[0].Wallet_Surplus - Number(req.body.amount_money) }, function () {})
                                    if (Number(req.body.amount_money) > 5000000) {
                                        let tradeh = new H_trade({
                                            ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                            Phone_number: req.session.Phone_number,
                                            Amount: Number(req.body.amount_money),
                                            Type_trade: "rut tien",
                                            Status: 0
                                        })
                                        let tranfer = new tranfers({
                                            ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                            Phone_number: req.session.Phone_number,
                                            CardNumber: req.body.card_number,
                                            Amount: Number(req.body.amount_money),
                                            Note: req.body.note,
                                            Status: 0
                                        })
                                        tradeh.save(function (err, user) {
                                            if (err) return console.error(1 + err);
                                            console.log("Saved");
                                        })
                                        tranfer.save(function (err, user) {
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
                                        let tranfer = new tranfers({
                                            ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                            Phone_number: req.session.Phone_number,
                                            CardNumber: req.body.card_number,
                                            Amount: Number(req.body.amount_money),
                                            Note: req.body.note,
                                            Status: 1
                                        })
                                        tradeh.save(function (err, user) {
                                            if (err) return console.error(1 + err);
                                            console.log("Saved");
                                        })
                                        tranfer.save(function (err, user) {
                                            if (err) return console.error(1 + err);
                                            console.log("Saved");
                                        })
                                    }
                                    res.render('rut-tien', { name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Thành công</div>" })
                                }

                            })


                        }
                    }
                    else if (req.body.card_number == "333333") {
                        if (req.body.end_date != "2022-12-12") {
                            res.render('rut-tien', { surplus: surplus,name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai ngày</div>" })
                        } else if (req.body.cvv != "577") {
                            res.render('rut-tien', { surplus: surplus,name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Sai CVV</div>" })
                        } else {
                            Wallet.find({ Phone_number: req.session.Phone_number }, function (err, docs) {
                                if (docs) {
                                    Wallet.updateOne({ Phone_number: req.session.Phone_number }, { Wallet_Surplus: docs[0].Wallet_Surplus - Number(req.body.amount_money) }, function () {})
                                    if (Number(req.body.amount_money) > 5000000) {
                                        let tradeh = new H_trade({
                                            ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                            Phone_number: req.session.Phone_number,
                                            Amount: Number(req.body.amount_money),
                                            Type_trade: "rut tien",
                                            Status: 0
                                        })
                                        let tranfer = new tranfers({
                                            ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                            Phone_number: req.session.Phone_number,
                                            CardNumber: req.body.card_number,
                                            Amount: Number(req.body.amount_money),
                                            Note: req.body.note,
                                            Status: 0
                                        })
                                        tradeh.save(function (err, user) {
                                            if (err) return console.error(1 + err);
                                            console.log("Saved");
                                        })
                                        tranfer.save(function (err, user) {
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
                                        let tranfer = new tranfers({
                                            ID: "RT" + req.session.Phone_number + d.getMinutes() + d.getHours() + d.getDate() + d.getMonth() + d.getYear(),
                                            Phone_number: req.session.Phone_number,
                                            CardNumber: req.body.card_number,
                                            Amount: Number(req.body.amount_money),
                                            Note: req.body.note,
                                            Status: 1
                                        })
                                        tradeh.save(function (err, user) {
                                            if (err) return console.error(1 + err);
                                            console.log("Saved");
                                        })
                                        tranfer.save(function (err, user) {
                                            if (err) return console.error(1 + err);
                                            console.log("Saved");
                                        })
                                    }
                                    res.render('rut-tien', { name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Thành công</div>" })
                                }

                            })


                        }
                    }else{
                        res.render('rut-tien', { surplus: surplus, name: req.session.Fullname, error: "<div class='bg-red-100 rounded-lg py-5 px-6 text-base text-red-700 mb-3 text-center mt-3' role='alert'>Thẻ không hỗ trợ</div>" })
                    }
                }
            })
        }
    })
    }else{
        res.redirect('/');
    }
    
})

router.get('/test', function (req, res) {
    let x = check_date('0562413183')
    check_date('0562413183').then(function (res) {
        console.log(res.length)
    })
    // x.then(function (result) {
    //     let y =result
    //     console.log(y)
    // })

})

module.exports = router;