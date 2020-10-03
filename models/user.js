const mongoose = require('mongoose');



const userSchema = new mongoose.Schema({
    googleId: String,
    firstName: String,
    lastName: String,
    profilePhoto: String,
});


var User = mongoose.model('User',userSchema);

module.exports = User;