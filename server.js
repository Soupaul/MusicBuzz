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
    firstName: String,
    lastName: String,
    profilePhoto: String,
});


// Schema for playlist
const playlistSchema = new mongoose.Schema({
    user: userSchema,
    songs: [{
        id: String,
        title: String,
        preview: String,
        cover_big: String,
        cover_xl: String,
        artist: String,
    }],
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
    callbackURL: "http://localhost:3000/auth/google/musicbuzz"
    },
    function(accessToken, refreshToken, profile, cb) {
        // console.log(profile);
        
        User.findOrCreate(
            {
                googleId: profile.id,
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                profilePhoto: profile.photos[0].value,
            },
            function (err, user) {
                return cb(err, user);
            }
        );
    }
));


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

app.get("/",function(req,res){
    
    let user=null;
    if (req.isAuthenticated()) {
        user = req.user;
        console.log(req.user);
        
    }
    res.render("home",{ showNavbar: true, user: user});
});


app.get("/songs/:id",function(req,res){

    let user = null;
    if (req.isAuthenticated()) {
        user = req.user;
    }
    const songId = req.params.id;
    let trackResponse = getTrack(songId,function(response){

        const songData = response;
        const song = {title: songData.title,preview: songData.preview, cover_big: songData.album.cover_big, cover_xl: songData.album.cover_xl, artist: songData.artist.name};

        res.render("song",{coverImageXL: song.cover_xl,coverImageBig: song.cover_big,artist: song.artist,songTitle: song.title,source: song.preview, user: user,showNavbar: false });

    });

});


// app.get("/search",function(req,res){

//     let auth;

//     if (req.isAuthenticated()) {
//         auth = true;
//     } else {
//         auth = false;
//     }

//     res.render("songlist",{songs: null,auth: auth});

// });

// for logging in the users

app.get("/login",
    passport.authenticate("google", { scope: ["profile"] })
);

app.get('/auth/google/musicbuzz', 
    passport.authenticate('google', { failureRedirect: "/login" }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect("/");
        console.log("Successfully logged in"); 
});


// logs out the users

app.get("/:userId/logout", function (req, res) {
    if (req.isAuthenticated()){
        req.logout();
        res.redirect("/");
        console.log("Successfully logged out");
    } else {
        res.redirect("/login")
    }
});


app.post("/search",function(req,res){
    let query = req.body.searchQuery;
    res.redirect("/search/" + query);
});


app.get("/search/:name",function(req,res){

    let user = null;
    if (req.isAuthenticated()) {
        user = req.user;
    }
    let query = req.params.name;

    let searchResponse = search(query,function(response){

        const data = response.data;
        let songList = [];
        for(const song of data){

            songList.push(new Song(song.id,song.title,song.preview,song.album.cover_big,song.album.cover_xl,song.artist.name));
        }
        res.render("songlist",{songs: songList,user: user,showNavbar: true});
    });
});


// Displaying the user playlist

app.get("/playlist", function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect("/" + req.user._id + "/playlist");
    } else {
        res.send("You need to be loggeg in to view or create your playlist");
    }
});

app.get("/:userId/playlist", function (req, res) {
    const currentUser = req.user;
    Playlist.find({ user: currentUser}, function (err, foundPlaylist) {
        if (!err) {
            if (!foundPlaylist) {
                res.send("No Playlists have been created");
            }
            else {
                res.render("songlist", {songs: foundPlaylist.songs, user: currentUser, showNavbar:true});
            }
        }
    });
});


// Adding new songs to user playlist

app.post("/playlist", function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect("/login");
    } else {
        const currentUser = req.user;
        const song = req.body.song
        Playlist.find({ user: currentUser }, function (err, foundPlaylist) {
            if (!err) {
                if (!foundPlaylist) {
                    // Create a new Playlist and add the song
                    const list = new Playlist({
                        user: currentUser,
                        songs: [song],
                    });
                    list.save(function (err) {
                        if (!err) {
                            // Redirects only after saving the song in the playlist
                            res.redirect("/");
                        }
                    });

                } else {
                    // Add song to existing playlist
                    foundPlaylist.push(song);
                    foundPlaylist.save(function (err) {  
                        if (!err) {
                            // Redirects only after saving the song 
                            res.redirect("/")
                        }
                    });
                }
            }
        });
        
    }
});



let PORT = process.env.PORT;
if (PORT == null || PORT == "") {
    PORT = 3000;
}

app.listen(PORT,function(){
    console.log("Server started on http://localhost:" + PORT);
});