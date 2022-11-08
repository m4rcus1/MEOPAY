const express = require('express')
const app = express()
const hbs = require('express-handlebars')
const path = require('path')
const port = 3000
const usersRoute = require('./resource/routes/users.route')

app.engine('hbs', hbs.engine({
    extname: 'hbs'
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'resource/views'));

app.use(express.static('src'))

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// app.get('/', (req, res) => {
//     res.render('home')
// })

// app.get('/login', (req, res) => {
//     res.render('login')
// })

// app.get('/register', (req, res) => {
//     res.render('register')
// })

// app.get('/login1st', (req, res) => {
//     res.render('login1st')
// })

app.use('/', usersRoute);

app.listen(port, () => {
    console.log(`
            Example app listening on http://localhost:${port}
            `)
})