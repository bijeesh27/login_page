const express = require("express");
const { title } = require("process");
const session = require("express-session");
const nocache = require("nocache");
const { v4: uuid } = require("uuid");
const path = require("path");
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');

const app = express();

// Add these environment variables at the top
const MONGODB_URI = 'mongodb://localhost:27017/loginApp';

// Update the MongoDB connection with error handling
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB successfully');
        // Create a default admin user if none exists
        return createDefaultAdmin();
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Function to create default admin user
async function createDefaultAdmin() {
    try {
        const adminExists = await User.findOne({ username: "admin@gmail.com" });
        if (!adminExists) {
            await User.create({
                username: "admin@gmail.com",
                password: "123"
            });
            console.log('Default admin user created');
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
}

app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.set("views", "./views");

app.use("/static", express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: uuid(),
    resave: false,
    saveUninitialized: true,
  })
);

app.use(nocache());

function islogin(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/");
  }
}

function islogOut(req, res, next) {
  if (req.session.user) {
    res.redirect("/home");
  } else {
    next();
  }
}

app.get("/", islogOut, (req, res) => {
  res.render("login", { message: "" });
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ username: email });
        if (!user) {
            return res.render("login", { message: "User not found" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.render("login", { message: "Invalid password" });
        }

        req.session.user = user.username;
        res.redirect("/home");
    } catch (error) {
        console.error('Login error:', error);
        res.render("login", { message: "An error occurred during login" });
    }
});

app.post("/register", async (req, res) => {
    const { email, password } = req.body;
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ username: email });
        if (existingUser) {
            return res.render("login", { 
                message: "User already exists. Please login instead." 
            });
        }

        // Create new user
        const newUser = new User({
            username: email,
            password: password  // Password will be hashed by the pre-save hook
        });

        await newUser.save();
        res.render("login", { 
            message: "Registration successful! Please login with your credentials." 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.render("login", { 
            message: "An error occurred during registration" 
        });
    }
});

app.get("/home", islogin, (req, res) => {
  res.render("home", { user: req.session.user });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    else {
      res.redirect("/");
    }
  });
});

app.listen(3001, () => {
  console.log(`http://localhost:3001`);
});
