const express = require('express');  
const router = express.Router();
const passport = require('passport');




router.get("/",function(req,res){
    
    let user=null;
    if (req.isAuthenticated()) {
        user = req.user;
    }
    res.render("home",{ showNavbar: true, user: user});
});

router.get("/login",
    passport.authenticate("google", { scope: ["profile"] })
);

router.get('/auth/google/musicbuzz', 
    passport.authenticate('google', { failureRedirect: "/login" }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect("/");
        console.log("Successfully logged in"); 
});



router.use("/songs",require('./songs'));


router.use("/:userId",require('./user'));


router.use("/search", require('./search'));



router.use("/playlists", require('./playlist'));

module.exports = router ;