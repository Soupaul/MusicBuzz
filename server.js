require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const unirest = require("unirest");
const _ = require("lodash");
const User = require('./models/user');

const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;


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
    async function(accessToken, refreshToken, profile, done) {
       
        try{
            let user = await User.findOne({id: profile.id.value});
        
            if(user){
                return done(null,user);
            }
            // if user is not found in the database the we have to sign up using google
            // create the user and set it to req.user
            else{
                User.create({
                    googleId: profile.id,
                    firstName: profile.name.givenName,
                    lastName: profile.name.familyName,
                    profilePhoto: profile.photos[0].value,
        
                    },function(err,user){
                        if(err){console.log(err); return ;}
                        return done(null,user);
                    });     
                
            }
    }catch(err){
        console.log(err);
    }
    }));


// For searching based on the query String.



// For getting a single track based on songId.



// For home page
app.use("/",require('./routes/index'));



// let PORT = process.env.PORT;
// if (PORT == null || PORT == "") {
//     PORT = 3000;
// }

// Starts the server at the desired PORT.

app.listen(3000,function(){
    console.log("Server started on port 3000");
});