const mongoose = require('mongoose');
const songSchema = require('../models/song').schema;
const userSchema = require('../models/user').schema;

const playlistSchema = new mongoose.Schema({
    user: userSchema,
    songs: [songSchema],
});


var Playlist = mongoose.model('Playlist',playlistSchema);

module.exports = Playlist;