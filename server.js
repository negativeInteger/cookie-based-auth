const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const { v4: createId } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(express.json()); // Parse JSON body
app.use(cookieParser()); // Parse cookies
app.use(
    session({
        secret: process.env.SECRET, // used to sign session ID
        resave: false, // Don't save session if unchanged
        saveUninitialized: false, //Don't create empty sessions
        cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 }, // 1 hr
    })
);

// Fake Database (in-memory for demo)
const users = [
    { id: 'e4569398-2c3a-4bbf-a6f2-ba9f68fead3f', email: "jcena@gmail.com", username: "johncena", password: bcrypt.hashSync("password123", 10) },
    { id: '452d77d1-301f-485e-a619-d18fdaa32dad', email: "srollins@gmail.com", username: "sethrollins", password: bcrypt.hashSync("password567", 10) },
];

// Signup Route ✅
app.post("/signup", (req, res) => {
    const { username, email, password } = req.body;
    console.log(req.body);
    
    // check if user already exists
    let foundUser = users.find((user) => user.email === email || user.username === username);
    if (!foundUser) {
        const userId = createId();
        let newUser = {
            id: userId,
            email,
            username,
            password: bcrypt.hashSync(password, 10)
        }
        users.push(newUser);
        req.session.user = { id : newUser.id , username: newUser.username };
        return res.status(201).json({ message: "Account created successfully"});
    }
    return res.status(409).json({ message: "username or email already exists" });
});
// Login Route
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find((user) => user.username === username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ message: "Invalid Credentials" });
    }

    if(!req.session.user) {
        req.session.user = { id: user.id, username: user.username }; // store user in session
        res.status(200).json({ message: "Login Successful" });
        // A session cookie (connect.sid) is set.
    }
});

// Protected Route (Requires Login)
app.get("/dashboard", (req, res) => {
    if(!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" })
    }
    res.json({ message: `Welcome, ${ req.session.user.username }` });
});

// Logout Route
app.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("connect.sid") // not mandatory (its useless anyway)
        res.json({ message: "Logged Out" })
        
    });
});

app.listen(PORT, () => console.log(`SERVER IS RUNNING ON LOCALHOST: ${PORT}`));