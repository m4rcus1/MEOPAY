const express = require('express')
const app = express()
const hbs = require('express-handlebars')
const path = require('path')
const port = 3000
const usersRoute = require('./resource/routes/users.route')
const adminRoute = require('./resource/routes/admin.route')
    //View engine handlebars
app.engine('hbs', hbs.engine({
    extname: 'hbs',
    helpers: {
        format: function(money) {
            let VND = new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'VND'
            })
            return VND.format(money)
        },
        checkStatus: function(status, name) {
            if (status == 1 || status == 0) {
                return `<div class="text-sm"> Chào ${name} </div> <span><a href="/profile"><i name="user-icon" class="fa-solid fa-2x fa-user-lock pl-[10px]"></i></a></span>`
            }
            if (status == 2) {
                return `<div class="text-sm"> Chào ${name} </div> <span><a href="/profile"><i class="fa-solid fa-2x fa-user pl-[10px]"></i></a></span>`
            }
            if (status == 100) {
                return `<a href="/register"><button class="loginBtn">Đăng Ký</button></a> <a href="/login"><button class="registerBtn">Đăng Nhập</button></a>`
            }


        }
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'resource/views'));

//Static file
app.use(express.static('src'))


//JSON encode
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


//Routing User 
app.use('/', usersRoute);
app.use('/admin', adminRoute);

//Create Server
app.listen(port, () => {
    console.log(`
            Example app listening on http://localhost:${port}
            `)
})