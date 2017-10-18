//can find as ejs file name
//viewFileName - explains, like this.

const express = require("express");
const router = express.Router();
const passport = require("passport");
const fs = require("fs");

const multer = require("multer");
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./images");
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

//index
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

//login
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

//signup
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

//search
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

//topten
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

//favorits
router.get("/like", ensureAuthenticated, function(req, res) {
    sess = req.session;
    const mylike = sess.user.like;
    return res.render("favorits", { contents: mylike });
});

//mynodvel
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

//writenodvel - simple info
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

//writenodvel - rewrite
router.get("/writenodvel/rewrite/:title", ensureAuthenticated, function(req, res, next) {
    Novel.findOne({ title: req.params.title }, function(err, nodvel) {
        if(err) return next(err);
        if(!nodvel) return next(err);
        sess = req.session;
        if(nodvel.ended) {
            req.flash("error", "Nodvel is ended. You can't change this.")
            return res.redirect("/nodvel/" + req.params.title);
        }
        if(sess.user.username === nodvel.writer) {
            req.flash("info", "Only writer can write or rewrite Nodvel.");
            return res.redirect("/");
        }
        res.render("writenodvel", { contents: nodvel });
    });
});

router.post("/writenodvel/rewrite/:title", function(req, res, next) {
    Novel.findOne({ title: req.params.title }, function(err, nodvel) {
        const title = req.body.title;
        nodvel.title = title;
        nodvel.genre = req.body.genre;
        nodvel.story = req.body.story;
        nodvel.save(function(err) {
            if(err) return next(err);
            req.flash("info", "Simple info saved.");
            return res.redirect("/nodvel/" + title);
        })
    });
});

//upload
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
            nodvel.backgroundImgs.push({ img: req.file.path, name: req.file.filename });
        }
        nodvel.save(function(err) {
            if(err) return next(err);
            req.flash("info", "Image uploaded.")
            return res.redirect("writenodvel/upload/" + nodvel.title);
        })
    });  
});

//writing, writed - paging
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
                    return res.render("writed", { contents: nodvel, pagecontents: nodvel.contents[i] });
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

router.post("/writenodvel/:title/:divergence/:page", function(req, res, next) {
    Novel.findOne({ title: req.params.title }, function(err, nodvel) {
        const text = req.body.text;
        const memo = req.body.memo;
        const divergence = req.params.divergence;
        const page = req.params.page;
        const nextDivergence = req.body.nextDivergence;
        const nextPage = req.body.nextPage;
        for(let i = 0; i <= nodvel.contents.length; i++) {
            if(nodvel.contents[i].divergence === divergence && nodvel.contents[i].page === page) {
                req.flash("error", "There's already contents");
                return res.redirect("/writenodvel/" + req.params.title + "/" + divergence + "/" + page);   
            }
        }
        if(req.body.background !== "none") {
            for(let i = 0; i < nodvel.backgroundImgs.length; i++) {
                if(req.body.background === nodvel.backgroundImgs[i].name) {
                    const background = nodvel.backgroundImgs[i].path;
                }
            }
        }
        else const background = "";
        nodvel.contents.push({
            divergence: divergence,
            page: page,
            nextPage: nextPage,
            nextDivergence: nextDivergence,
            text: text,
            memo: memo,
            background: background
        });
        for(let i = 0; i <= nodvel.contents.length; i++) {
            if(nodvel.contents[i].divergence === divergence && nodvel.contents[i].page === page) {
                if(req.body.choice1text && req.body.choice1nextDivergence && req.body.choice1nextPage) {
                    nodvel.contents[i].choice.push({
                        text: choice1Text,
                        nextDivergence: req.body.choice1nextDivergence,
                        nextPage: req.body.choice1nextPage
                    });
                }
                if(req.body.choice2text && req.body.choice2nextDivergence && req.body.choice2nextPage) {
                    nodvel.contents[i].choice.push({
                        text: choice2Text,
                        nextDivergence: req.body.choice2nextDivergence,
                        nextPage: req.body.choice2nextPage
                    });
                }
                if(req.body.choice3text && req.body.choice3nextDivergence && req.body.choice3nextPage) {
                    nodvel.contents[i].choice.push({
                        text: choice3Text,
                        nextDivergence: req.body.choice3nextDivergence,
                        nextPage: req.body.choice3nextPage
                    });
                }
                if(req.body.choice4text && req.body.choice4nextDivergence && req.body.choice4nextPage) {
                    nodvel.contents[i].choice.push({
                        text: choice4Text,
                        nextDivergence: req.body.choice4nextDivergence,
                        nextPage: req.body.choice4nextPage
                    });
                }
                if(req.body.character1 !== "none") {
                    for(let i = 0; i < nodvel.characterImgs.length; i++) {
                        if(req.body.character1 === nodvel.characterImgs[i].name) {
                            nodvel.contents[i].character.push({ path: nodvel.characterImgs[i].path, name: nodvel.characterImgs[i].name });
                        }
                    }
                }  
                if(req.body.character2 !== "none") {
                    for(let i = 0; i < nodvel.characterImgs.length; i++) {
                        if(req.body.character2 === nodvel.characterImgs[i].name) {
                            nodvel.contents[i].character.push({ path: nodvel.characterImgs[i].path, name: nodvel.characterImgs[i].name });
                        }
                    }
                }  
                if(req.body.character3 !== "none") {
                    for(let i = 0; i < nodvel.characterImgs.length; i++) {
                        if(req.body.character3 === nodvel.characterImgs[i].name) {
                            nodvel.contents[i].character.push({ path: nodvel.characterImgs[i].path, name: nodvel.characterImgs[i].name });
                        }
                    }
                }  
                if(req.body.character4 !== "none") {
                    for(let i = 0; i < nodvel.characterImgs.length; i++) {
                        if(req.body.character4 === nodvel.characterImgs[i].name) {
                            nodvel.contents[i].character.push({ path: nodvel.characterImgs[i].path, name: nodvel.characterImgs[i].name  });
                        }
                    }
                }  
            }
        }
        nodvel.save(function(err) {
            if(err) return next(err);
            if(nextDivergence && nextPage) {
                return res.redirect("/writenodvel/" + nodvel.title + "/" + nextDivergence + "/" + nextPage);
            }
            else if(req.body.choice1text && req.body.choice1nextDivergence && req.body.choice1nextPage) {
                return res.redirect("/writenodvel/" + nodvel.title + "/" + req.body.choice1nextDivergence + "/" + req.body.choice1nextPage);
            }
        });
    });
});

//nodvelsearch - searching in making page
router.get("/writenodvel/search/:title", ensureAuthenticated, function(req, res, next) {
    Novel.findOne({ title: req.params.title }, function(err, nodvel) {
        if(err) return next(err);
        if(!nodvel) {
            req.flash("error", "There's no Nodvel.");
            return res.redirect("/");
        }
        return res.render("nodvelsearch", { contents: nodvel, pagecontents: nodvel.contents, title: req.params.title });
    });
});

router.post("/writenodvel/search/:title", function(req, res, next) {
    Novel.findOne({ title: req.params.title }, function(err, nodvel) {
        if(err) return next(err);
        if(!nodvel) {
            req.flash("error", "There's no Nodvel.");
            return res.redirect("/");
        }
        let contents = []; 
        nodvel.contents.forEach(function(item) {
            if(item.text || item.memo) {
                if(item.text.search(req.body.searchWord) || item.memo.search(req.body.searchWord)) {
                    contents.push(item);
                }
            }
        });
        return res.render("nodvelsearch", { contents: nodvel, pagecontents: contents, title: req.params.title });
    });
});

//writing - rewrite
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
                    return res.render("writing", { contents: nodvel, pagecontents: nodvel.contents[i] });
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
        if(req.body.background !== "none") {
            for(let i = 0; i < nodvel.backgroundImgs.length; i++) {
                if(req.body.background === nodvel.backgroundImgs[i].name) {
                    const background = nodvel.backgroundImgs[i].path;
                }
            }
        }
        else const background = "";
        for(let i = 0; i <= nodvel.contents.length; i++) {
            if(nodvel.contents[i].divergence === divergence && nodvel.contents[i].page === page) {
                nodvel.contents[i].test = text;
                nodvel.contents[i].memo = memo;
                nodvel.contents[i].divergence = divergence;
                nodvel.contents[i].page = page;
                nodvel.contents[i].nextDivergence = nextDivergence;
                nodvel.contents[i].nextPage = nextPage;
                nodvel.contents[i].background = background;
                nodvel.contents[i].choice.splice(0, nodvel.contents[i].choice.length);
                nodvel.contents[i].character.splice(0, nodvel.contents[i].character.length);
                if(req.body.choice1text && req.body.choice1nextDivergence && req.body.choice1nextPage) {
                    nodvel.contents[i].choice.push({
                        text: choice1Text,
                        nextDivergence: req.body.choice1nextDivergence,
                        nextPage: req.body.choice1nextPage
                    });
                }
                if(req.body.choice2text && req.body.choice2nextDivergence && req.body.choice2nextPage) {
                    nodvel.contents[i].choice.push({
                        text: choice2Text,
                        nextDivergence: req.body.choice2nextDivergence,
                        nextPage: req.body.choice2nextPage
                    });
                }
                if(req.body.choice3text && req.body.choice3nextDivergence && req.body.choice3nextPage) {
                    nodvel.contents[i].choice.push({
                        text: choice3Text,
                        nextDivergence: req.body.choice3nextDivergence,
                        nextPage: req.body.choice3nextPage
                    });
                }
                if(req.body.choice4text && req.body.choice4nextDivergence && req.body.choice4nextPage) {
                    nodvel.contents[i].choice.push({
                        text: choice4Text,
                        nextDivergence: req.body.choice4nextDivergence,
                        nextPage: req.body.choice4nextPage
                    });
                }
                if(req.body.character1 !== "none") {
                    for(let i = 0; i < nodvel.characterImgs.length; i++) {
                        if(req.body.character1 === nodvel.characterImgs[i].name) {
                            nodvel.contents[i].character.push({ path: nodvel.characterImgs[i].path, name: nodvel.characterImgs[i].name });
                        }
                    }
                }  
                if(req.body.character2 !== "none") {
                    for(let i = 0; i < nodvel.characterImgs.length; i++) {
                        if(req.body.character2 === nodvel.characterImgs[i].name) {
                            nodvel.contents[i].character.push({ path: nodvel.characterImgs[i].path, name: nodvel.characterImgs[i].name });
                        }
                    }
                }  
                if(req.body.character3 !== "none") {
                    for(let i = 0; i < nodvel.characterImgs.length; i++) {
                        if(req.body.character3 === nodvel.characterImgs[i].name) {
                            nodvel.contents[i].character.push({ path: nodvel.characterImgs[i].path, name: nodvel.characterImgs[i].name });
                        }
                    }
                }  
                if(req.body.character4 !== "none") {
                    for(let i = 0; i < nodvel.characterImgs.length; i++) {
                        if(req.body.character4 === nodvel.characterImgs[i].name) {
                            nodvel.contents[i].character.push({ path: nodvel.characterImgs[i].path, name: nodvel.characterImgs[i].name });
                        }
                    }
                }  
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

//move in nodvel page - _move post to here
router.post("writenodvel/move/:title", function(req, res, next) {
    const divergence = req.body.moveDivergence;
    const page = req.body.movePage;
    const title = req.params.title;
    return res.redirect("/writenodvel/" + title + "/" + divergence + "/" + page);
});

//nodvel - show nodvel head page
router.get("/nodvel/:title", ensureAuthenticated, function(req, res, next) {
    sess = req.session;
    Novel.findOne({ title: req.params.title }, function(err, nodvel) {
        if(err) return next(err);
        if(!nodvel) return next(err);
        if(!nodvel.ended) {
            if(sess.user.username === nodvel.writer) {
                return res.render("nodvel", { contents: nodvel });
            }
            else {
                req.flash("info", "Nodvel does not ended or rewrited now.");
                return res.redirect("/");
            }
        }
        return res.render("nodvel", { contents: nodvel, user: sess.user });
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
        else if(req.body.rewrite) {
            nodvel.ended = false;
            nodvel.save(function(err) {
                if(err) return next(err);
                return res.redirect("/nodvel/" + nodvel.title);
            });
        }
        else if(req.body.end) {
            nodvel.ended = true;
            nodvel.save(function(err) {
                if(err) return next(err);
                return res.redirect("/nodvel/" + nodvel.title);
            });
        }
    });
});

//save - viewing list of nodvel what user liked
router.get("/saved", ensureAuthenticated, function(req, res, next) {
    sess = req.session;
    User.findOne({ username: sess.user.username }, function(err, user) {
        if(err) return next(err);
        if(!user) return next(err);
        res.render("save", { contents: user.save });
    });
});

router.get("/saved/delete/:title/:divergence/:page", ensureAuthenticated, function(req, res, next) {
    sess = req.session;
    User.findOne({ username: sess.user.username }, function(err, user) {
        if(err) return next(err);
        if(!user) return next(err);
        for(let i = 0; i < user.save.length; i++) {
            if(user.save[i].title === req.params.title && user.save[i].divergence === req.params.divergence && user.save[i].page === req.params.page) {
                user.save.splice(i, 1);
                user.save(function(err) {
                    if(err) return next(err);
                    req.flash("info", "Save point deleted.");
                    return res.redirect("/saved"); 
                });
            }
        }
        req.flash("error", "Unknown error exist. Deleteing stopped.");
        return res.redirect("/saved");
    });
});

//show - showing nodvel to user, reading nodvel part
router.get("/nodvel/:title/:divergence/:page", ensureAuthenticated, function(req, res, next) {
    Novel.findOne({ title: req.params.title }, function(err, nodvel) {
        let prevPage = 0;
        let prevDivergence = 0;
        if(err) return next(err);
        if(!nodvel) return next(err);
        if(!nodvel.ended) {
            req.flash("info", "Writer writing this Nodvel now. Please wait until finish.");
            res.redirect("/");
        }
        for(let i = 0; i < nodvel.contents.length; let++) {
            if(nodvel.contents[i].nextDivergence === req.params.divergence && nodvel.contents[i].nextPage === req.params.page) {
                nodvel.contents[i].divergence = prevDivergence;
                nodvel.contents[i].page = prevPage;
            }
        }
        nodvel.contents.forEach(function(item) {
            if(item.page === req.params.page && item.divergence === req.params.divergence) {
                return res.render("view", { pagecontents: item, title: req.params.title, prevDivergence: prevDivergence, prevPage: prevPage });
            }
        });
        req.flash("error", "There's no scene in " + req.params.divergence + ", " + req.params.page);
        return res.redirect("/nodvel/" + req.params.title);
    });
});

//show - saving part in show, make save point in user DB
router.post("/nodvel/save/:title/:divergence/:page", function(req, res, next) {
    sess = req.sesion;
    User.findOne({ username: sess.user.username }, function(err, user) {
        user.push({
            title: req.params.title,
            divergence: req.params.divergence,
            page: req.params.page
        });
        user.save(function(err) {
            if(err) return next(err);
            return res.redirect("/nodvel/" + req.params.title + "/" + req.params.divergence + "/" + req.params.page);
        });
    });
});

module.exports = router;
