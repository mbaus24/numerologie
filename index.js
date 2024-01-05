import path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import session from 'express-session';
import express from 'express';
import Handlebars from "handlebars";
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new sqlite3.Database('./my_database.db');
const template = Handlebars.compile("Name: {{name}}");
console.log(template({ name: "Nils" }));
const app = express()

const hostname = '127.0.0.1';
const port = 3000;
const donnée = 42

db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    email TEXT,
    password TEXT
)`);

app.use(express.urlencoded({ extended: true }));

app.use("/static", express.static(path.join(__dirname, '/static')))
app.use("/public", express.static(path.join(__dirname, '/public')))


//midleware
app.use(session({
    secret: 'blahblahblah',
    resave: false,
    saveUninitialized: true,
}));



app.get('/', (req, res) => {
    res.redirect(301, '/static/index.html')
    
})


app.get('/login', (req, res) => {
    // Render your login page here
    res.redirect("static/login.html");
});

app.get('/register', (req, res) => {
    // Render your registration page here
    res.redirect('/static/register.html');
});


app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    
    // Validate the input data
    if (!username || !email || !password) {
        res.status(400).send('All fields are required');
        return;
    }

    // Hash the password - you should always hash passwords before storing them
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert the new user into the database
    db.run(`INSERT INTO users(username, email, password) VALUES(?, ?, ?)`, [username, email, hashedPassword], function(err) {
        if (err) {
            console.error(err);
            res.status(500).send('An error occurred while registering the user');
            return;
        }
        req.session.username = username;
        res.redirect('/welcome');
    });
});


    
app.get('/welcome', (req, res) => {
        const username = req.session.username;
        // Render your welcome page here
        res.send('Welcome '+ username + ' !');
});
    

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
        // Here you can handle the login
        // For example, you can check the username and password against a database
    
        // If the login is successful, you can set a session variable
        req.session.user = username;
    
        res.redirect('/');
});
    
/* app.post('/register', (req, res) => {
    const { username, password } = req.body;
    
        // Here you can handle the registration
        // For example, you can save the username and password to a database
    
    res.redirect('/login');
});
 */






app.use(function (req, res) {
    console.log("et c'est le 404 : " + req.url);

    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html');

    res.end("<html><head><title>la quatre cent quatre</title></head><body><img  src=\"https://upload.wikimedia.org/wikipedia/commons/b/b4/Peugeot_404_Champs.jpg\" /></body></html>");

});


//login et register









app.use(function (req, res, next) {
    let date = new Date(Date.now())
    console.log('Time:', date.toLocaleDateString(), date.toLocaleTimeString(), "; url :", req.url);
    next(); // sans cette ligne on ne pourra pas poursuivre.
})

app.listen(port, hostname);
console.log(`Server running at http://${hostname}:${port}/`);