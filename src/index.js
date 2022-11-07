const express = require('express')
const app = express()
const hbs = require('express-handlebars')
const path = require('path')
const port = 3000

app.engine('hbs', hbs.engine({
    extname: 'hbs'
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'resource/views'));

app.use(express.static('src'))

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.listen(port, () => {
    console.log(`
            Example app listening on http://localhost:${port}
            `)
})