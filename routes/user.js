const express = require('express');  
const router = express.Router();
const User = require('../models/user');
const Playlist = require('../models/playlist');


router.get("/logout", function (req, res) {
    if (req.isAuthenticated()){
        req.logout();
        res.redirect("/");
        console.log("Successfully logged out");
    } else {
        res.redirect("/login")
    }
});

router.get("/playlists" , function (req, res) {
    User.findOne({ _id: req.user.id }, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            Playlist.findOne({ user: foundUser}, function (err, foundPlaylist) {
                if (err) {
                    console.log(err);
                } else {
                    if (!foundPlaylist) {
                        res.send("No Playlists have been created");
                        
                    } else {
                        res.render("songlist",{songs: foundPlaylist.songs, user: foundPlaylist.user, showNavbar: true});
                    }
                }
            });
        }
    });
});






module.exports = router ;