const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const unirest = require("unirest");
const PORT = 3000;

const app = express();
app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));

// let songId;

class Song{

    constructor(id,title,preview,cover_medium,cover_xl,artist){

        this.id = id;
        this.title = title;
        this.preview = preview;
        this.cover_medium = cover_medium;
        this.cover_xl = cover_xl;
        this.artist = artist;
    }

}

function search(response, query="linkin park"){

    var req = unirest("GET", "https://deezerdevs-deezer.p.rapidapi.com/search");

    req.query({
        "q": query // Change this to search for anything else.
    });

    req.headers({
        "x-rapidapi-host": "deezerdevs-deezer.p.rapidapi.com",
        "x-rapidapi-key": "98685096c7msh43ece79f8aee2f7p163bb6jsn089fa34bed5f",
        "useQueryString": true
    });


    req.end(function (res) {
        if (res.error) throw new Error(res.error);

        const data = res.body.data;

        let songList = [];

        for(const song of data){

            songList.push(new Song(song.id,song.title,song.preview,song.album.cover_medium,song.album.cover_xl,song.artist.name));

        }

        
        response.render("songlist",{songs: songList});

    });

}

// function getTrack(response){

//     var req = unirest("GET", "https://deezerdevs-deezer.p.rapidapi.com/track/" + songId);

//     req.headers({
//         "x-rapidapi-host": "deezerdevs-deezer.p.rapidapi.com",
//         "x-rapidapi-key": "98685096c7msh43ece79f8aee2f7p163bb6jsn089fa34bed5f",
//         "useQueryString": true
//     });


//     req.end(function (res) {
//         if (res.error) throw new Error(res.error);

//         const songData = res.body;

//         console.log(songData);

//         const song = {title: songData.title,preview: songData.preview, cover_medium: songData.album.cover_medium, cover_xl: songData.album.cover_xl};

//         response.render("song",{coverImageXL: song.cover_xl,coverImageMedium: song.cover_medium,songTitle: song.title,source: song.preview });
        
//     });

// }

// app.get("/song",function(req,res){

//     getTrack(res);

// });


function searchForSongs(query) {
    var req = unirest("GET", "https://deezerdevs-deezer.p.rapidapi.com/search");

    req.query({
        "q": query // Change this to search for anything else.
    });

    req.headers({
        "x-rapidapi-host": "deezerdevs-deezer.p.rapidapi.com",
        "x-rapidapi-key": "98685096c7msh43ece79f8aee2f7p163bb6jsn089fa34bed5f",
        "useQueryString": true
    });

    let songList = [];

    req.end(function (res) {

        if (res.error) throw new Error(res.error);

        const data = res.body.data;

        

        for(const song of data) {
            songList.push(new Song(song.id,song.title,song.preview,song.album.cover_medium,song.album.cover_xl,song.artist.name));

        }
    });
    return songList;
}




app.get("/",function(req,res){

    search(res);

});

app.post("/", function(req, res) {
    const query = req.body.query;
    console.log(query);
    // const songList = searchForSongs(query);
    // console.log(songList);
    // res.render("songlist", {songs: songList});
    search(res, query);
});

// app.post("/search",function(req,res){

//     songId = req.body.songId;
//     console.log(songId);

//     res.redirect("/song");

// });

app.listen(PORT,function(){

    console.log("Server started on http://localhost:" + PORT);

});