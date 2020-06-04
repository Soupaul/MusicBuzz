require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const unirest = require("unirest");
const _ = require("lodash");

const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");



const app = express();


app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));


app.use(session({
    secret: "Some Random Secret",
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/songDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);

// Schema for the user
const userSchema = new mongoose.Schema({
    googleId: String,
});

// Schema for playlist
const playlistSchema = new mongoose.Schema({
    user: userSchema,
    songs: [String],
});


userSchema.plugin(findOrCreate);


const User = mongoose.model("User", userSchema);

const Playlist = mongoose.model("Playlist", playlistSchema);


passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});



passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:8000/auth/google/musicbuzz"
    },
    function(accessToken, refreshToken, profile, cb) {
        console.log(profile);
        
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

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

        const song = {title: songData.title,preview: songData.preview, cover_medium: songData.album.cover_medium, cover_xl: songData.album.cover_xl};

        res.render("song",{coverImageXL: song.cover_xl,coverImageMedium: song.cover_medium,songTitle: song.title,source: song.preview });

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

            songList.push(new Song(song.id,song.title,song.preview,song.album.cover_medium,song.album.cover_xl,song.artist.name));

        }

        res.render("songlist",{songs: songList});

    });

    
    
});


let PORT = process.env.PORT;
if (PORT == null || PORT == "") {
    PORT = 3000;
}

app.listen(PORT,function(){
    console.log("Server started on http://localhost:" + PORT);
});