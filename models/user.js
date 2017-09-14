const bcrypt = require("bcrypt-nodejs");
const mongoose = require("mongoose");

const SALT_FACTOR = 10;

const userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    like: [{
        developer: String,
        title: String,
        date: { type: Date, default: Date.now }  
    }]
});

const noop = function() {};

userSchema.pre("save", function(done) {
    const user = this;
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

const User = mongoose.model("user", userSchema);

module.exports = User;
