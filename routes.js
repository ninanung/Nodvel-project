const express = require("express");
const router = express.Router();
const passport = require("passport");
const fs = require("fs");
const multer = require("multer");
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function(req, file, cb) {
        let filename = file.originalname + "-" + Date.now;
        if(file.mimetype === "image/png") {
            filename = filename + ".png";
        }
        else if(file.mimetype === "image/jpeg") {
            filename = filename + ".jpeg";
        }
        cb(null, filename);
    }
});
var upload = multer({ storage: storage });
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
                return res.render("index", { users: users, contents: Contents, pagination: pageNum});
            });
        });
    });
});

router.get("/login", function (req, res) {
    return res.render("login");
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
    return res.redirect("/");
});

router.get("/signup", function (req, res) {
    return res.render("signup");
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

router.get("/like", ensureAuthenticated, function(req, res) {
    sess = req.session;
    const mylike = sess.user.like;
    return res.render("favorits", { contents: mylike });
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
    return res.render("manual");
});

//retouch
router.get("/writenodvel/retouch/:title", function(req, res) {
    sess = req.session
    const writer = sess.user.username;
    return res.render("writenodvel", { writer: writer, title: req.params.title });
});

router.post("/writenodvel/retouch/:title", function(req, res, next) {
    Novel.findOne({ title: req.params.title }, function(err, nodvel) {
        const title = req.body.title;
        nodvel.title = title;
        nodvel.genre = req.body.genre;
        nodvel.story = req.body.story;
        nodvel.save(function(err) {
            if(err) return next(err);
            return res.redirect("/nodvel/" + title);
        })
    });
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
    const story = req.body.stroy;
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
            return res.redirect("/writenodvel/upload/" + title);
        });
    });
});

router.get("/writenodvel/upload/:title", ensureAuthenticated, function(req, res, next) {
    Novel.findOne({ title: req.params.title }, function(err, nodvel) {
        if(err) return next(err);
        if(!nodvel) {
            req.flash("error", "There's no Nodvel has that title.");
            return res.redirect("/");
        }
        res.render("upload", { contents: nodvel });
    });
});

router.post("/writenodvel/upload/:title", upload.single("image"), function(req, res, next) {
    Novel.findOne({ title: req.params.rirle }, function(err, nodvel) {
        if(err) return next(err);
        if(!nodvel) {
            req.flash("error", "There's no Nodvel has that title.");
            return res.redirect("/");
        }
        if(req.body.character) {
            nodvel.characterImgs.push({ path: req.file.path, name: req.file.filename });
        }
        else if(req.body.background) {
            nodvel.backgroundImgs.push({ img: req.file.path });
        }
        nodvel.save(function(err) {
            if(err) return next(err);
            req.flash("info", "Image uploaded.")
            return res.redirect("writenodvel/upload/" + nodvel.title);
        })
    });  
});

//writing
router.get("/writenodvel/:title/:divergence/:page", ensureAuthenticated, function(req, res, next) {
    Novel.findOne({ title: req.params.title }, function(err, nodvel) {
        if(err) return next(err);
        if(!nodvel) {
            req.flash("error", "There's no Nodvel has that title.");
            return res.redirect("/");
        }
        sess = req.session;
        if(sess.user.username === nodvel.writer) {
            for(let i = 0; i < nodvel.contents.length; i++) {
                if(nodvel.contents[i].divergence === req.params.divergence && nodvel.contents[i].page === req.params.page) {
                    return res.render("writed", { contents: nodvel, pagecontents: nodvel.contents[i], divergence: nodvel.contents[i].divergence, page: nodvel.contents[i].page });
                }
            }
            return res.render("writing", { contents: nodvel, divergence: req.params.divergence, page: req.params.page });
        }
        else {
            req.flash("info", "Only writer can write or rewrite Nodvel.");
            return res.redirect("/");
        }
    });
});

//still writing
router.post("/writenodvel/:title/:divergence/:page", function(req, res, next) {
    Novel.findOne({ title: req.params.title }, function(err, nodvel) {
        const text = req.body.text;
        const memo = req.body.memo;
        const divergence = req.params.divergence;
        const page = req.params.page;
        const nextDivergence = req.body.nextDivergence;
        const nextPage = req.body.nextPage;
        const character1 = req.body.character1;
        const character2 = req.body.character2;
        const character3 = req.body.character3;
        const character4 = req.body.character4;
        const background = req.body.background;
        let characterNumber = 0;
        for(let i = 0; i <= nodvel.contents.length; i++) {
            if(nodvel.contents[i].divergence === divergence && nodvel.contents[i].page === page) {
                req.flash("error", "There's already contents");
                return res.redirect("/writenodvel/" + req.params.title + "/" + divergence + "/" + page);   
            }
        }
        if(character1 !== "none") character1 = ""; characterNumber++; 
        if(character2 !== "none") character2 = ""; characterNumber++;
        if(character3 !== "none") character3 = ""; characterNumber++;
        if(character4 !== "none") character4 = ""; characterNumber++;
        nodvel.contents.push({
            divergence: divergence,
            page: page,
            nextPage: nextPage,
            nextDivergence: nextDivergence,
            text: text,
            memo: memo,
            character1: character1,
            character2: character2,
            character3: character3,
            character4: character4,
            characterNumber: characterNumber,
            background: background
        });
        nodvel.save(function(err) {
            if(err) return next(err);
            return res.redirect("/writenodvel/" + nodvel.title);
        });
    });
});

router.get("/writenodvel/rewrite/:title/:divergence/:page", ensureAuthenticated, function(req, res, next) {
    Novel.findOne({ title: req.params.title }, function(err, nodvel) {
        if(err) return next(err);
        if(!nodvel) {
            req.flash("error", "There's no Nodvel has that title.");
            return res.redirect("/");
        }
        sess = req.session;
        if(sess.user.username === nodvel.writer) {
            for(let i = 0; i < nodvel.contents.length; i++) {
                if(nodvel.contents[i].divergence === req.params.divergence && nodvel.contents[i].page === req.params.page) {
                    return res.render("writing", { contents: nodvel, pagecontents: nodvel.contents[i], divergence: nodvel.contents[i].divergence, page: nodvel.contents[i].page });
                }
            }
            req.flash("error", "There's no contents in that divergence and page.");
            return res.render("writing", { contents: nodvel, divergence: req.params.divergence, page: req.params.page });
            
        }
        else {
            req.flash("info", "Only writer can write or rewrite Nodvel.");
            return res.redirect("/");
        }
    });
});

router.post("/writenodvel/rewrite/:title/:divergence/:page", function(req, res, next) {
    Novel.findOne({ title: req.params.title }, function(err, nodvel) {
        if(err) return next(err);
        if(!nodvel) {
            req.flash("error", "There's no Nodvel has that title.");
            return res.redirect("/");
        }
        const text = req.body.text;
        const memo = req.body.memo;
        const divergence = req.params.divergence;
        const page = req.params.page;
        const nextDivergence = req.body.nextDivergence;
        const nextPage = req.body.nextPage;
        const character1 = req.body.character1;
        const character2 = req.body.character2;
        const character3 = req.body.character3;
        const character4 = req.body.character4;
        const background = req.body.background;
        let characterNumber = 0;
        for(let i = 0; i <= nodvel.contents.length; i++) {
            if(nodvel.contents[i].divergence === divergence && nodvel.contents[i].page === page) {
                nodvel.contents[i].test = text;
                nodvel.contents[i].memo = memo;
                nodvel.contents[i].divergence = divergence;
                nodvel.contents[i].page = page;
                nodvel.contents[i].nextDivergence = nextDivergence;
                nodvel.contents[i].nextPage = nextPage;
                if(character1 !== "none") character1 = ""; characterNumber++; 
                if(character2 !== "none") character2 = ""; characterNumber++;
                if(character3 !== "none") character3 = ""; characterNumber++;
                if(character4 !== "none") character4 = ""; characterNumber++;
                nodvel.contents[i].character1 = character1;
                nodvel.contents[i].character2 = character2;
                nodvel.contents[i].character3 = character3;
                nodvel.contents[i].character4 = character4;
                nodvel.contents[i].characterNumber = characterNumber;
                nodvel.save(function(err) {
                    if(err) return next(err);
                    return res.redirect("/writenodvel/" + req.params.title + "/" + divergence + "/" + page);
                });
            }
            else continue;
        }
        req.flash("error", "There's no contents in that divergence and page.");
        return res.redirect("/writenodvel/" + req.params.title + "/" + divergence + "/" + page);
    });
});

router.post("writing/move/:divergence/:page", function(req, res, next) {
    const divergence = req.body.moveDivergence;
    const page = req.body.movePage;
    const title = req.body.moveTitle;
    return res.redirect("/writenodvel/" + title + "/" + divergence + "/" + page);
});

router.get("/nodvel/:title", ensureAuthenticated, function(req, res, next) {
    Novel.findOne({ title: req.params.title }, function(err, nodvel) {
        if(err) return next(err);
        if(!nodvel) return next(err);
        return  res.render("nodvel", { contents: nodvel });
    });
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
