const express = require("express");
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const session = require("express-session");
const path = require("path");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const fs = require("fs");

const setUpPassport = require("./setuppassport");
const routes = require("./routes");

const app = express();
const http = require("http").Server(app);
mongoose.connect("mongodb://localhost:27017/test", {
    useMongoClient: true
});
setUpPassport();

app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: "ninanung",
    resave: true,
    saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(routes);

http.listen(app.get("port"), function() {
    console.log("server started on port: " + app.get("port"));
});
