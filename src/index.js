const express = require('express')
const app = express()
const hbs = require('express-handlebars')
const path = require('path')
const port = 3000
const usersRoute = require('./resource/routes/users.route')

//View engine handlebars
app.engine('hbs', hbs.engine({
    extname: 'hbs'
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


//Create Server
app.listen(port, () => {
    console.log(`
            Example app listening on http://localhost:${port}
            `)
})