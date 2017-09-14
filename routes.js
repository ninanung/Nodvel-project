const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("./models/user");
const Novel = require("./models/novel");

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.flash("info", "You must be logged in to see this page.");
        res.redirect("/login");
    }
};

router.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    sess = req.session;
    sess.user = req.user;
    res.locals.errors = req.flash("error");
    res.locals.infos = req.flash("info");
    next();
});

router.get("/", function(req, res, next){
    User.find().sort({ createdAt: "descending" }).exec(function(err, users){
        if(err) { return next(err) }
        let page = req.params.page;
        if(page == null) { page = 1 }
        const skipSize = (page - 1) * 10;
        const limitSize = 10;
        let pageNum = 1;
        Novel.count({ ended: true }, function(err, totalCount){
            if(err) throw err;
            pageNum = Math.ceil(totalCount / limitSize);
            Novel.find({ ended: true }).sort({ date: -1 }).skip(skipSize).limit(limitSize).exec(function(err, Contents){
                if(err) throw err;
                res.render("index", { users: users, contents: Contents, pagination: pageNum});
            });
        });
    });
});

router.get("/:page", function(req, res, next){
    User.find().sort({ createdAt: "descending" }).exec(function(err, users){
        if(err) { return next(err) }
        let page = req.params.page;
        if(page == null) { page = 1 }
        const skipSize = (page - 1) * 10;
        const limitSize = 10;
        let pageNum = 1;
        Novel.count({ ended: true }, function(err, totalCount){
            if(err) throw err;
            pageNum = Math.ceil(totalCount / limitSize);
            Novel.find({ ended: true }).sort({ date: -1 }).skip(skipSize).limit(limitSize).exec(function(err, Contents){
                if(err) throw err;
                res.render("index", { users: users, contents: Contents, pagination: pageNum});
            });
        });
    });
});

router.get("/login", function (req, res) {
    res.render("login");
});

router.post("/login", passport.authenticate("login", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}));

router.get("/logout", function (req, res) {
    req.logout();
    req.session.destroy(function (err) {
        if (err) console.log("session destroy err occured!");
        console.log("session destroyed!");
    });
    res.redirect("/");
});

router.get("/signup", function (req, res) {
    res.render("signup");
});

router.post("/signup", function (req, res, next) {
    const username = req.body.username;
    const password = req.body.password;
    const confirmPassword = req.body.confirmpassword;
    if (password === confirmPassword) {
        User.findOne({ username: username }, function (err, user) {
            if (err) { return next(err); }
            if (user) {
                req.flash("error", "User already exists.");
                return res.redirect("/signup");
            }
            const newUser = new User({
                username: username,
                password: password
            });
            newUser.save(function (err) {
                if (err) return next(err);
                req.flash("info", "Sign up success! Please log in.");
                return res.redirect("/");
            });
        });
    }
    else {
        req.flash("error", "Password not confirmed.");
        res.redirect("/signup");
    }
});
