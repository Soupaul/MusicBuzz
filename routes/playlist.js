const express = require('express');  
const router = express.Router();
const Song = require('../models/song');
const Playlist = require('../models/playlist');

router.get("/", function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect("/" + req.user._id + "/playlists");
    } else {
        res.send("You need to be logged in to view or create your playlist");
    }
});

router.post("/",function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect("/login");
    } else {
        const currentUser = req.user;
        const songInfo = JSON.parse(req.body.songInfo);
        console.log(songInfo);
        Playlist.findOne({ user: currentUser }, function (err, foundPlaylist) {
            if (err) {
                console.log(err);
            } else {
                const songToAdd  = new Song({
                    id: songInfo.id,
                    title: songInfo.title,
                    preview: songInfo.preview,
                    cover_big: songInfo.cover_big,
                    cover_xl: songInfo.cover_xl,
                    artist: songInfo.artist
                });
                if (!foundPlaylist) {
                    // Create a new Playlist
                    songs = [songToAdd];
                    const list = new Playlist({
                        user: currentUser,
                        songs: songs,
                    });
                    list.save(function (err) {
                        if (!err) {
                            res.redirect("/");
                            console.log("Successfully added song to your favorites");
                        }
                    });
                } else {
                    
                    let flag = 1;
                    // Check if song already exists in the playlist
                    foundPlaylist.songs.forEach(song => {
                        if (song.id === songToAdd.id) {
                            flag = 0;
                        }
                        if (flag === 0) {
                            console.log("Song already exists in your favorites");
                            res.redirect("/");
                        } else {
                            // Add Song to existing Playlist
                            foundPlaylist.songs.push(songToAdd);
                            foundPlaylist.save(function (err) {
                                console.log("Successfully added song to your favorites");
                                res.redirect("/");
                            });
                        }
                    });
                }
            }
        });
    }
});







module.exports = router;