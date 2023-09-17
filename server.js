const express = require("express");
const app = express();
const md5 = require("md5");
const session = require("express-session");
const path = require("path");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const encoder = bodyParser.urlencoded();

//VARIABLES
const dbHost = "localhost";
const dbUser = "root";
const dbPass = "root";
const dbDatabase = "tdbi";
const port = 3000;

// expose static path
app.use(express.static(path.join(__dirname, "static")));

// set view engine
app.set("view engine", "ejs");

//initialize session
app.use(
    session({
        secret: "secret",
        resave: true,
        saveUninitialized: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// route pages
app.get("/", (req, res) => {
    get_index(req, res);
});

function get_index(req, res) {
    res.render("pages/index", {
        loggedin: req.session.loggedin,
    });
}

// host app on port xxxx
app.listen(port, () => {
    console.log(`App listening at port ${port}`);
    console.log("http://localhost:" + port + "/");
});

//connect to local database
const connection = mysql.createConnection({
    host: dbHost,
    user: dbUser,
    password: dbPass,
    database: dbDatabase,
});

// connection test
connection.connect(function (error) {
    if (error) throw error;
    else console.log("connection to database successful");
});
