const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const PORT = 3000;

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));

app.get("/",function(req,res){
    
    res.sendFile(__dirname + "/index.html");

});

app.listen(PORT,function(){

    console.log("Server started on http://localhost:" + PORT);

});