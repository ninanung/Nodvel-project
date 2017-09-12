var passport = require("passport");
var localStrategy = require("passport-local").Strategy;

var User = require("./models/user");

module.exports = function() {
    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        })
    });
    passport.use("login", new localStrategy(function(id, password, done) {
        User.findOne({ id: id }, function(err, user) {
            if(err) {
                return done(err);
            }
            if(!user) {
                return done(null, false, { message: "No user has that name!"});
            }
            user.checkPassword(password, function(err, isMatch) {
                if(err) {
                    return done(err);
                }
                if(isMatch) {
                    return done(null, user);
                }
                else {
                    return done(null, false, { message: "Invalid password"});
                }
            });
        });
    }));
};