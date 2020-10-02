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

// Schema for the song
const songSchema = new mongoose.Schema({
    id: String,
    title: String,
    preview: String,
    cover_big: String,
    cover_xl: String,
    artist: String,
});

// Schema for playlist
const playlistSchema = new mongoose.Schema({
    user: userSchema,
    songs: [songSchema],
});


userSchema.plugin(findOrCreate);


const User = mongoose.model("User", userSchema);

const Playlist = mongoose.model("Playlist", playlistSchema);

const Song = mongoose.model("Song", songSchema);


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


// For searching based on the query String.

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

// For getting a single track based on songId.

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

// For home page

app.get("/",function(req,res){
    
    let user=null;
    if (req.isAuthenticated()) {
        user = req.user;
    }
    res.render("home",{ showNavbar: true, user: user});
});

// For displaying the player.

app.get("/songs/:id",function(req,res){

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

// Posts the query to the search function of the API.

app.post("/search",function(req,res){
    let query = req.body.searchQuery;
    res.redirect("/search/" + query);
});


// Displays the search results based on the name parameter.

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
});


// Redirects to the user's playlist.

app.get("/playlists", function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect("/" + req.user._id + "/playlists");
    } else {
        res.send("You need to be logged in to view or create your playlist");
    }
});

// Displays the user's playlist. 

app.get("/:userId/playlists", function (req, res) {
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


// Adding new songs to user playlist

app.post("/playlists", function (req, res) {
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



// let PORT = process.env.PORT;
// if (PORT == null || PORT == "") {
//     PORT = 3000;
// }

// Starts the server at the desired PORT.

app.listen(3000,function(){
    console.log("Server started on port 3000");
});