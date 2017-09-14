const passport = require("passport");
const localStrategy = require("passport-local").Strategy;

const User = require("./models/user");

module.exports = function() {
    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        })
    });
    passport.use("login", new localStrategy(function(username, password, done) {
        User.findOne({ username: username }, function(err, user) {
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
