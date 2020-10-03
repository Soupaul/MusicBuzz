const express = require('express');  
const router = express.Router();
const Song = require('../models/song');
const unirest = require("unirest");

function getTrack(songId,callback){

    var req = unirest("GET", "https://deezerdevs-deezer.p.rapidapi.com/track/" + songId);

    req.headers({
        "x-rapidapi-host": "deezerdevs-deezer.p.rapidapi.com",
        "x-rapidapi-key": process.env.API_KEY,
        "useQueryString": true
    });

    req.end(function (res) {
        if (res.error) throw new Error(res.error);
        
        else{
            console.log(res.body);
            callback(res.body);
        }

    });
}



router.get('/',function(req,res){
    let query = req.body.searchQuery;
    res.redirect("/songs/" + query);
});


router.get("/:id",function(req,res){

    

    let user = null;
    if (req.isAuthenticated()) {
        user = req.user;
    }
    const songId = req.params.id;
    let trackResponse = getTrack(songId,function(response){

        const songData = response;
        const song = new Song({
            id: songId,
            title: songData.title,
            preview: songData.preview,
            cover_big: songData.album.cover_big,
            cover_xl: songData.album.cover_xl,
            artist: songData.artist.name,
        });
        // const song = {title: songData.title,preview: songData.preview, cover_big: songData.album.cover_big, cover_xl: songData.album.cover_xl, artist: songData.artist.name};

        res.render("song",{song: song, user: user,showNavbar: false });

    });

});




module.exports = router ;