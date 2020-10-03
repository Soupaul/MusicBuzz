const mongoose = require('mongoose');


const songSchema = new mongoose.Schema({
    id: String,
    title: String,
    preview: String,
    cover_big: String,
    cover_xl: String,
    artist: String,
});


var Song= mongoose.model('Song',songSchema);

module.exports = Song;