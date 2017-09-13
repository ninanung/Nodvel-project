var mongoose = require("mongoose");

var novel = mongoose.Schema({
    title: { type: String, required: true, unique: true },
    writer: { type: String, required: true },
    ended: { type: Boolean, default: false },
    contents: [{
        img: [{ charactor: { data: Buffer, contentType: String} }],
        backgroundImg: { data: Buffer, contentType: String },
        text: { type: String },
    }],
    allImg: { data: Buffer, contentType: String },
    date: { type: Date, default: Date.now }
});

var Novel = mongoose.model("novel", novel);

module.exports = Novel;
