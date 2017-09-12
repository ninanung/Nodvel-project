var bcrypt = require("bcrypt-nodejs");
var mongoose = require("mongoose");

var SALT_FACTOR = 10;

var userSchema = mongoose.Schema({
    id = { type: String, required: true, unique: true },
    password = { type: String, required: true },
    like = [{
        developer: String,
        title: String,
        date: { type: Date, default: Date.now }  
    }]
});

var noop = function() {};

userSchema.pre("save", function(done) {
    var user = this;
    if(!user.isModified("password")) {
        return done();
    }
    bcrypt.genSalt(SALT_FACTORm, function(err, salt) {
        if(err) {
            return done(err)
        }
        bcrypt.hash(user.password, salt, noop, function(err, hashPassword) {
            if(err) {
                return done(err);
            }
            user.password = hashPassword;
            done();
        });
    });
});

userSchema.methods.checkPassword = function(guess, done) {
    bcrypt.compare(guess, this.password, function(err, isMatch) {
        done(err, isMatch);
    })
}

var User = mongoose.model("user", userSchema);

module.exports = User;