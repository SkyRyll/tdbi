const express = require("express");
const app = express();
const session = require("express-session");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const encoder = bodyParser.urlencoded();
const bcrypt = require("bcrypt");
const { check, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");

//VARIABLES
const dbHost = "localhost";
const dbUser = "root";
const dbPass = "root";
const dbDatabase = "tdbi";
const dbPort = 3306;
const saltRounds = 10;
const nodeAppPort = 3000;

// expose static path
app.use(express.static("static"));

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

// host app on port xxxx
app.listen(nodeAppPort, () => {
    console.log(`App listening at port ${nodeAppPort}`);
    console.log("http://localhost:" + nodeAppPort + "/");
});

// Create a rate limiter with your desired options
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
});

// Apply the rate limiter middleware to specific routes or globally
app.use("/*", limiter); // Apply to '/api' routes, for example

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// route pages
app.get("/", (req, res) => {
    get_index(req, res);
});

app.get("/catalog", (req, res) => {
    get_catalog(req, res);
});

app.get("/entry/:id", async (req, res) => {
    const entryId = req.params.id;

    try {
        // Query the database to fetch data for the entry
        const query = "SELECT * FROM catalog WHERE scientificName = ?";
        connection.query(query, [entryId], (err, result) => {
            if (err) {
                console.error("Database query error: " + err.message);
                res.status(500).json({ error: "Internal Server Error" });
            } else {
                // Log the JSON data
                console.log(result[0]);

                // Render an HTML template with the entry data
                get_entry(req, res, result[0]);
            }
        });
    } catch (err) {
        // Handle errors appropriately
        res.status(500).send("Internal Server Error");
    }
});

app.get("/account", (req, res) => {
    get_account(req, res);
});

app.get("/login", (req, res) => {
    get_login(req, res);
});

app.get("/register", (req, res) => {
    get_register(req, res);
});

app.get("/logout", (req, res) => {
    get_logout(req, res);
});

app.get("/error", (req, res) => {
    get_error(req, res);
});

function get_index(req, res) {
    res.render("pages/index", {
        loggedin: req.session.loggedin,
    });
}

function get_catalog(req, res) {
    res.render("pages/catalog", {
        loggedin: req.session.loggedin,
    });
}

function get_entry(req, res, entryData) {
    res.render("pages/entry_template", {
        loggedin: req.session.loggedin,
        entry: entryData,
    });
}

function get_account(req, res) {
    //check if user is logged in
    if (req.session.loggedin) {
        show_account(req, res, req.session.userID);
    } else {
        get_login(req, res);
    }
}

function show_account(req, res, user_id) {
    let user = null;

    const query = "SELECT * FROM accounts WHERE id = ?";
    connection.query(query, [user_id], function (error, results, fields) {
        if (error) throw error;
        if (results.length > 0) {
            //user found
            user = results[0];

            //don't supply password hash ;)
            delete user.password;
            res.render("pages/account", {
                user: user,
                loggedin: req.session.loggedin,
            });
        } else {
            //invalid userID
            get_error(req, res, "No User was found");
        }
    });
}

function get_login(req, res) {
    //check if user is logged in
    if (req.session.loggedin) {
        show_account(req, res, req.session.userID);
    } else {
        res.render("pages/login", {
            loggedin: req.session.loggedin,
        });
    }
}

function get_register(req, res) {
    //check if user is logged in
    if (req.session.loggedin) {
        show_account(req, res, req.session.userID);
    } else {
        res.render("pages/register", {
            loggedin: req.session.loggedin,
        });
    }
}

function get_logout(req, res) {
    //check if user is logged in
    if (req.session.loggedin) {
        do_logout(req, res);
    } else {
        get_error(req, res, "Logout failed. You were not logged in, please login to logout");
    }
}

function do_logout(req, res) {
    //close session
    req.session.username = null;
    req.session.userID = null;
    req.session.password = null;
    req.session.loggedin = false;

    get_index(req, res);
}

function get_error(req, res, errorMessage) {
    res.render("pages/error", {
        loggedin: req.session.loggedin,
        errorMessage: errorMessage,
    });
    res.end();
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/getAnimalCatalog", (req, res) => {
    const query = "SELECT * FROM catalog ORDER BY scientificName ASC";
    connection.query(query, (err, result) => {
        if (err) {
            console.error("Database query error: " + err.message);
            res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.json(result);
        }
    });
});

//login check and redirect
app.post(
    "/login",
    [
        check("username").trim().isLength({ min: 1 }).escape(),
        check("password").trim().isLength({ min: 8 }), // You might want to add more validation here
    ],
    encoder,
    function (req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            get_error(req, res, "Error while trying to log in. The provided data did not meet the requirements");
        } else {
            var username = req.body.username;
            var password = req.body.password;

            // Retrieve 'hash' and 'salt' from the database based on the username
            const query = "SELECT * FROM accounts WHERE username = ?";
            connection.query(query, [username], function (error, results, fields) {
                if (error) {
                    get_error(req, res, "Login failed. Please try again.");
                }

                if (results.length > 0) {
                    const storedHash = results[0].hash; // Get the stored hash from the database
                    const salt = results[0].salt; // Get the salt from the database

                    bcrypt.hash(password, salt, function (err, hash) {
                        if (err) {
                            get_error(req, res, "Login failed. Please try again.");
                        }

                        // Compare 'hash' with 'storedHash' to verify the password
                        if (hash === storedHash) {
                            // Passwords match, grant access
                            req.session.loggedin = true;
                            req.session.username = username;
                            req.session.userID = results[0].id;

                            // Render home page
                            get_account(req, res);
                        } else {
                            // Passwords do not match, deny access
                            get_error(req, res, "Login failed. Incorrect password.");
                        }
                    });
                } else {
                    // User not found, handle accordingly
                    get_error(req, res, "Login failed. User not found.");
                }
            });
        }
    }
);

// register user
app.post(
    "/register",
    [
        check("email").isEmail().normalizeEmail(),
        check("firstname").trim().isLength({ min: 1 }).escape(),
        check("lastname").trim().isLength({ min: 1 }).escape(),
        check("username").trim().isLength({ min: 1 }).escape(),
        check("password").custom((value) => {
            // Use a regular expression to validate the password
            const passwordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})/;
            if (!passwordRegex.test(value)) {
                get_error(req, res, "Password must have at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.");
            }
            return true;
        }),
    ],
    encoder,
    function (req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            get_error(req, res, "Error while trying to create user. The provided data did not meet the requirements");
        } else {
            var email = req.body.email;
            var firstname = req.body.firstname;
            var lastname = req.body.lastname;
            var username = req.body.username;
            var password = req.body.password;
            const salt = bcrypt.genSaltSync(saltRounds);

            bcrypt.hash(password, salt, function (err, hash) {
                if (err) {
                    // Error while hashing, user wont be created
                    get_error(req, res, "Error while trying to create user. Please try again");
                }

                const query = "SELECT * FROM accounts WHERE username = ?";
                connection.query(query, [username], function (error, results, fields) {
                    // If there is an issue with the query, output the error
                    if (error) throw error;
                    // If the account exists
                    if (results.length > 0) {
                        //user already exists, skip login
                        get_error(req, res, "This username is already taken");
                    } else {
                        const query = "SELECT * FROM accounts WHERE email = ?";
                        connection.query(query, [email], function (error, results, fields) {
                            // If there is an issue with the query, output the error
                            if (error) throw error;
                            // If the account exists
                            if (results.length > 0) {
                                //user already exists, skip login
                                get_error(req, res, "This email is already in use");
                            } else {
                                const query = "INSERT INTO accounts (email, firstname, lastname, username, hash, salt) VALUES (?,?,?,?,?,?)";
                                connection.query(query, [email, firstname, lastname, username, hash, salt], function (error, results, fields) {
                                    // If there is an issue with the query, output the error
                                    if (error) throw error;
                                    // account added
                                    req.session.loggedin = true;
                                    req.session.username = username;
                                    req.session.userID = results.insertId;

                                    // render home page
                                    get_account(req, res);
                                });
                            }
                        });
                    }
                });
            });
        }
    }
);
