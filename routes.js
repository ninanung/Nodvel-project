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

router.get("/index/:page", function(req, res, next){
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

router.get("/search", ensureAuthenticated, function(req, res){
    res.render("search", { contents: false });
});

router.post("/search", function (req, res) {
    const searchWord = req.body.search;
    const searchCondition = { $regex: searchWord };
    sess = req.session;
    Novel.find({ ended: true, $or: [{ title: searchCondition }, { story: searchCondition }, { writer: searchCondition }] }).sort({ date: -1 }).exec(function (err, Contents) {
        if (err) throw err;
        res.render("search", { contents: Contents });
    });
});

router.get("/topten", ensureAuthenticated, function(req, res, next) {
    Novel.find({ ended: true }).sort({ like: -1 }).skip(10).exec(function(err, Contents) {
        if(err) {
            return next(err);
        }
        else {
            return res.render("topten", { contents: Contents, genre: false });
        }
    });
});

router.get("/topten/:genre", ensureAuthenticated, function(req, res, next) {
    const genre = req.params.genre;
    Novel.find({ ended: true, genre: genre }).sort({ like: -1 }).skip(10).exec(function(err, contents) {
        if(err) {
            return next(err);
        }
        else {
            return res.render("topten", { contents: contents, genre: genre });
        }
    });
});

router.get("/like", ensureAuthenticated, function(req, res, next) {
    sess = req.session;
    const mylike = sess.user.like;
    res.render("favorits", { contents: mylike });
});

router.get("/mynodvel", ensureAuthenticated, function(req, res, next) {
    sess = req.session;
    const myname = sess.user.username;
    Novel.find({ writer: myname }).sort({ date: -1 }).exec(function(err, Contents) {
        if(err) {
            return next(err);
        }
        else {
            return res.render("mynodvel", { contents: Contents });
        }
    });
});

router.get("/help", function(req, res) {
    res.render("manual");
});

router.get("/writenodvel", ensureAuthenticated, function(req, res) {
    sess = req.session;
    const writer = sess.user.username;
    res.render("writenodvel", { writer: writer });
});

router.post("/writenodvel", function(req, res, next) {
    sess = req.session;
    const writer = sess.user.username;
    const title = req.body.title;
    const genre = req.body.genre;
    const sotry = req.body.stroey;
    Novel.findOne({ title: title }, function(err, novel) {
        if(err) {
            return next(err);
        }
        if(novel) {
            req.flash("error", "Same title already exist.");
            return res.redirect("/writenodvel");
        }
        const newNodvel = new Novel({
            writer: writer,
            title: title,
            story: story,
            genre: genre
        });
        newNodvel.save(function(err) {
            if(err) {
                return next(err);
            }
            return res.redirect("/writenodvel/" + title);
        });
    });
});

router.get("/writenodvel/:title", ensureAuthenticated, function(req, res, next) {
    Novel.findOne({ title: req.params.title }, function(err, nodvel) {
        if(err) return next(err);
        if(!nodvel) {
            req.flash("error", "There's no Nodvel has that title.");
            return res.redirect("/");
        }
        sess = req.session;
        if(sess.user.username === nodvel.writer) {
            return res.render("writing");
        }
        else {
            req.flash("info", "Only writer can write or rewrite Nodvel.");
            return res.redirect("/");
        }
    });
});

router.post("/writenodvel/:title", function(req, res, next) {

});

router.get("/nodvel/:title", ensureAuthenticated, function(req, res, next) {
    res.render("nodvel");
});

router.post("/nodvel/:title", function(req, res, next) {
    Novel.findOne({ title: req.params.title }, function(err, nodvel) {
        if(err) return next(err);
        if(!nodvel) return next(err);
        let like = nodvel.like;
        sess = req.session;
        if(req.body.comment) {
            const writer = sess.user.username;
            const comment = req.body.comment;
            nodvel.comment.push({ name: writer, memo: comment });
            nodvel.save(function(err) {
                if(err) return next(err);
                return res.redirect("/nodvel/" + nodvel.title);
            });
        }
        else if(req.body.like) {
            User.findOne({ username: sess.user.username }, function(err, user) {
                if(err) return next(err);
                if(!user) return next(err);
                for(let i; i <= user.like.length; i++) {
                    if(user.like[i].title === nodvel.title) {
                        req.flash("info", "Already like this Nodvel");
                        return res.redirect("/nodvel/" + nodvel.title);
                    }
                    else continue;
                }
                like++;
                nodvel.like = like;
                nodvel.save(function(err) {
                    if(err) return next(err);
                    return console.log("like saved");
                });
                user.like.push({ developer: nodvel.writer, title: nodvel.title});
                user.save(function(err) {
                    if(err) return next(err);
                    return res.redirect("/nodvel/" + nodvel.title);
                });
            });
        }
        else if(req.body.cancellike) {
            User.findOne({ username: sess.user.username }, function(err, user) {
                if(err) return next(err);
                if(!user) return next(err);
                for(let i; i <= user.like.length; i++) {
                    if(user.like[i].title === nodvel.title) {
                        user.like.splice(i, 1);
                        break;
                    }
                    else continue;
                }
                like--;
                nodvel.like = like;
                nodvel.save(function(err) {
                    if(err) return next(err);
                    return console.log("cancelLike saved");
                });
                user.save(function(err) {
                    if(err) return next(err);
                    return res.redirect("/nodvel/" + nodvel.title);
                });
            });
        }
    });
});

module.exports = router;
