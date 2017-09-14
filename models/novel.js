const mongoose = require("mongoose");

const novel = mongoose.Schema({
    title: { type: String, required: true, unique: true },
    writer: { type: String, required: true },
    story: { type: String, required: true },
    genre: { typr: String, required: true },
    ended: { type: Boolean, default: false },
    contents: [{
        page: { type: Number, required: true },
        img: [{ charactor: { data: Buffer, contentType: String} }],
        backgroundImg: { data: Buffer, contentType: String },
        text: { type: String },
    }],
    allImg: [{ 
        img: { data: Buffer, contentType: String } 
    }],
    date: { type: Date, default: Date.now },
    like: { type: Number, default: 0 }
});

const Novel = mongoose.model("novel", novel);

module.exports = Novel;
