import path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import session from 'express-session';
import express from 'express';
import Handlebars from "handlebars";
import bcrypt from 'bcrypt';
import multer from 'multer';
import ejs from 'ejs';
import bodyParser from 'body-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new sqlite3.Database('./my_database.db');
const template = Handlebars.compile("Name: {{name}}");

const app = express()
const upload = multer({ dest: 'uploads/' });
const hostname = '127.0.0.1';
const port = 3000;
const donnée = 42

app.use(bodyParser.text());
// Set EJS as the view engine
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'static'));



db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    email TEXT,
    password TEXT
)`, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log("Users table created successfully");
    }
});

db.run(`CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY,
    category TEXT,
    subcategory TEXT,
    image TEXT
)`, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log("Images table created successfully");
    }
});

db.run(`CREATE TABLE IF NOT EXISTS Categories (
    id INTEGER PRIMARY KEY,
    category TEXT
)`, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log("Categories table created successfully");
    }
});

db.run(`CREATE TABLE IF NOT EXISTS SubCategories (
    id INTEGER PRIMARY KEY,
    subcategory TEXT,
    id_category INTEGER
)`, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log("Sub table created successfully");
    }
});



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



app.post('/create.html', upload.single('image'), (req, res) => {
    const { category, subcategory } = req.body;
    const image = req.file.filename; // multer automatically saves the file and gives it a filename
    console.log(req.body)
    console.log(req.file)
    console.log(image)
    // Insert the data into the database
    db.run(`INSERT INTO images(category, subcategory, image) VALUES(?, ?, ?)`, [category, subcategory, image], function(err) {
        if (err) {
            console.error(err);
            res.status(500).send('An error occurred while uploading the image');
            return;
        }  console.log(`A row has been inserted with rowid ${this.lastID}`);
        
        res.redirect('/gallery.html');
    });
});

app.get('/gallery/:category', (req, res) => {
    const category = req.params.category;

    db.all(`SELECT * FROM images WHERE category = ? ORDER BY subcategory`, [category], (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send('An error occurred while fetching the images');
            return;
        }

        const categories = [...new Set(rows.map(image => image.category))];

        res.render('gallery', { images: rows, categories: categories });
    });
});

app.get('/gallery.html', (req, res) => {
    db.all(`SELECT * FROM images ORDER BY category, subcategory`, [], (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send('An error occurred while fetching the images');
            return;
        }

        const categories = [...new Set(rows.map(image => image.category))];

        res.render('gallery', { images: rows, categories: categories });
    });
});



app.get('/get-categories', (req, res) => {
    db.all(`SELECT * FROM Categories`, [], (err, rows) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(rows);
        }
    });
});

app.get('/static/create.html', (req, res) => {
    db.all(`SELECT * FROM Categories`, [], (err, rows) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(rows);
        }
    });
});

app.get('/welcome', (req, res) => {
        const username = req.session.username;
        // Render your welcome page here
        res.send('Bienvenue '+ username + ' !');
});
    

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
        // Here you can handle the login
        // For example, you can check the username and password against a database
    
        // If the login is successful, you can set a session variable
        req.session.user = username;
    
        res.redirect('/');
});
  
app.post('/create-category', (req, res) => {
    const newCategoryName = req.body;
    db.run(`INSERT INTO categories(category) VALUES(?)`, [newCategoryName], function(err) {
        if (err) {
            console.error(err);
            res.status(500).send('An error occurred while uploading the image');
            return;
        }  console.log(`A row has been inserted with rowid ${this.lastID} and category ${newCategoryName}`);
        
        res.redirect('/static/create.html');
    });
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

    res.write('<html>');
    res.write('<head><title>404 Not Found</title></head>');
    res.write('<body>');
    res.write('<h1>404 Not Found</h1>');
    res.write('<p>The requested URL ' + req.url + ' was not found on this server.</p>');
    res.write('<img src="https://http.cat/404" alt="Error 404 Cat">'); // Inserting error 404 cat image
    res.write('</body>');
    res.write('</html>');

    res.end();
});


//login et register









app.use(function (req, res, next) {
    let date = new Date(Date.now())
    console.log('Time:', date.toLocaleDateString(), date.toLocaleTimeString(), "; url :", req.url);
    next(); // sans cette ligne on ne pourra pas poursuivre.
})

app.listen(port, hostname);
console.log(`Server running at http://${hostname}:${port}/`);