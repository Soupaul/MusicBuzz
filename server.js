const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const unirest = require("unirest");
const _ = require("lodash");
const PORT = 3000;

const app = express();
app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));


class Song{

    constructor(id,title,preview,cover_big,cover_xl,artist){

        this.id = id;
        this.title = title;
        this.preview = preview;
        this.cover_big = cover_big;
        this.cover_xl = cover_xl;
        this.artist = artist;
    }

}

function search(query,callback){

    var req = unirest("GET", "https://deezerdevs-deezer.p.rapidapi.com/search");

    req.query({
        "q": query
    });

    req.headers({
        "x-rapidapi-host": "deezerdevs-deezer.p.rapidapi.com",
        "x-rapidapi-key": "98685096c7msh43ece79f8aee2f7p163bb6jsn089fa34bed5f",
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

function getTrack(songId,callback){

    var req = unirest("GET", "https://deezerdevs-deezer.p.rapidapi.com/track/" + songId);

    req.headers({
        "x-rapidapi-host": "deezerdevs-deezer.p.rapidapi.com",
        "x-rapidapi-key": "98685096c7msh43ece79f8aee2f7p163bb6jsn089fa34bed5f",
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

app.get("/songs/:id",function(req,res){

    const songId = req.params.id;

    let trackResponse = getTrack(songId,function(response){

        const songData = response;

        const song = {title: songData.title,preview: songData.preview, cover_big: songData.album.cover_big, cover_xl: songData.album.cover_xl, artist: songData.artist.name};

        res.render("song",{coverImageXL: song.cover_xl,coverImageBig: song.cover_big,artist: song.artist,songTitle: song.title,source: song.preview });

    });

});





app.get("/",function(req,res){

    res.render("songlist",{songs: null});

});

app.post("/",function(req,res){

    let query = req.body.searchQuery;

    let searchResponse = search(query,function(response){

        const data = response.data;

        let songList = [];

        for(const song of data){

            songList.push(new Song(song.id,song.title,song.preview,song.album.cover_big,song.album.cover_xl,song.artist.name));

        }

        res.render("songlist",{songs: songList});

    });

    
    
});

app.listen(PORT,function(){

    console.log("Server started on http://localhost:" + PORT);

});