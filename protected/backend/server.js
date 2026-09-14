const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");
const pool = require("./database");
require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const app = express();
app.set("trust proxy", 1); 


const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://127.0.0.1:5500";




// ===============================
// MIDDLEWARE
// ===============================

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Session configuration
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 
        
        }
    })
);


// Serve public files
app.use(express.static(path.join(__dirname, "../../public")));


// ===============================
// HOME ROUTE
// ===============================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "../../public", "login.html")
    );
});


// ===============================
// SIGNUP
// ===============================

app.post("/api/signup", async (req, res) => {

    try {

        const { name, email, password } = req.body;

        // Check empty fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }


        // Password validation
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }


        // Check whether email already exists
        const [existingUsers] = await pool.execute(
            "SELECT id FROM user WHERE email = ?",
            [email]
        );


        if (existingUsers.length > 0) {

            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });

        }


        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);


        // Insert user
        const [result] = await pool.execute(
            `
            INSERT INTO user (name, email, password)
            VALUES (?, ?, ?)
            `,
            [name, email, hashedPassword]
        );


        res.status(201).json({
            success: true,
            message: "Account created successfully",
            userId: result.insertId
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});


// ===============================
// LOGIN
// ===============================

app.post("/api/login", async (req, res) => {

    try {

        const { email, password } = req.body;


        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });

        }


        // Find user
        const [users] = await pool.execute(
            `
            SELECT id, name, email, password
            FROM user
            WHERE email = ?
            `,
            [email]
        );


        if (users.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });

        }


        const user = users[0];


        // Compare password
        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );


        if (!passwordMatches) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });

        }


        // Save user inside session
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email
        };


        res.json({
            success: true,
            message: "Login successful"
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});


// ===============================
// AUTHENTICATION MIDDLEWARE
// ===============================

function requireLogin(req, res, next) {

    if (!req.session.user) {

        return res.redirect("/login.html");

    }

    next();
}


// ===============================
// PROTECTED WELCOME PAGE
// ===============================

app.get("/welcome", requireLogin, (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "..",
            "welcome.html"
        )
    );

});


// ===============================
// GET CURRENT USER
// ===============================

app.get("/api/me", (req, res) => {

    if (!req.session.user) {

        return res.status(401).json({
            success: false,
            message: "Not logged in"
        });

    }


    res.json({
        success: true,
        user: req.session.user
    });

});


// ===============================
// LOGOUT
// ===============================

app.post("/api/logout", (req, res) => {

    req.session.destroy((error) => {

        if (error) {

            return res.status(500).json({
                success: false,
                message: "Could not logout"
            });

        }


        res.clearCookie("connect.sid");


        res.json({
            success: true,
            message: "Logged out successfully"
        });

    });

});


// ===============================
// START SERVER
// ===============================

app.listen(PORT, async () => {

    try {

        const connection = await pool.getConnection();

        console.log("Connected to MySQL");

        connection.release();

    } catch (error) {

        console.error("MySQL connection failed:", error.message);

    }


    console.log(
        `Server running at http://localhost:${PORT}`
    );

});