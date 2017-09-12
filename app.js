var express = require("express");
var app = express();
var http = require("http").Server(app);
var bodyParser = require("body-parser");
var flash = require("flash");
var mongoose = require("mongoose");
var session = require("express-session");
var path = require("path");
var passport = require("passport");
var cookieParser = require("cookie-parser");

var setUpPassport = require("./setuppassport");
var routes = require("./routes");

mongoose.connect("mongodb://localhost:27017/test");
setUpPassport();

app.set("port", process.env.PORT || 3000);
app.set("views", path.join(_dirname, "views"));
app.set("view engine", "react");

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