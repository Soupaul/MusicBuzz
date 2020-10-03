const express = require('express');  
const router = express.Router();
const Song = require('../models/song');
const unirest = require("unirest");



function search(query,callback){

    var req = unirest("GET", "https://deezerdevs-deezer.p.rapidapi.com/search");

    req.query({
        "q": query
    });

    req.headers({
        "x-rapidapi-host": "deezerdevs-deezer.p.rapidapi.com",
        "x-rapidapi-key": process.env.API_KEY,
        "useQueryString": true
    });

    req.end(function (res) {
        if (res.error) throw new Error(res.error);
        else{
            // console.log(res.body);
            callback(res.body);
        }
    });
}




router.post('/',function(req,res){
    let query = req.body.searchQuery;
    res.redirect("/search/" + query);
});

router.get("/:name", function(req,res){
    
    let user = null;
    if (req.isAuthenticated()) {
        user = req.user;
    }
    let query = req.params.name;

    let searchResponse = search(query,function(response){

        const data = response.data;
        let songList = [];
        for(const song of data){
            const newSong = new Song({
                id: song.id,
                title: song.title,
                preview: song.preview,
                cover_big: song.album.cover_big,
                cover_xl: song.album.cover_xl,
                artist: song.artist.name
            });
            songList.push(newSong);
        }
        res.render("songlist",{songs: songList,user: user,showNavbar: true});
    });
})




module.exports = router ;