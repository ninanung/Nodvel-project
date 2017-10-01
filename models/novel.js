const mongoose = require("mongoose");

//want to make preview img
const novel = mongoose.Schema({
    title: { type: String, required: true, unique: true },
    writer: { type: String, required: true },
    story: { type: String, required: true },
    genre: { type: String, required: true },
    ended: { type: Boolean, default: false },
    contents: [{
        nextDivergence: Number,
        nextPage: Number,
        divergence: { type: Number, default: 1 },
        page: Number,
        memo: String,
        character: [{ path: String }],
        background: String,
        text: String,
        choice: [{ text: String, nextDivergence: Number, nextPage: Number }]
    }],
    characterImgs: [{
        path: String,
        name: String
    }],
    backgroundImgs: [{
        path: String,
        name: String
    }],
    date: { type: Date, default: Date.now },
    like: { type: Number, default: 0 },
    comment: [{
        name: String,
        memo: String,
        date: { type: Date, default: Date.now }
    }]
});

const Novel = mongoose.model("novel", novel);

module.exports = Novel;
