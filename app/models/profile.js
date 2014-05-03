var mongoose = require('mongoose');
var hash = require('../util/hash');


ProfileSchema = mongoose.Schema({

        emailhash: String,
        dob: Date,
        address1: String,
        address2: String,
        city: String,
        phone: String,
        profile_pic_path: String,
        education: {
            degree: String,
            school: String
        },
        grades_honours: String,
        interests_experience: String
});


ProfileSchema.statics.signup = function(emailhash, done) {
    var Profile = this;

    Profile.create({
        emailhash: emailhash,
        dob: Date.now(),
        address1: "",
        address2: "",
        city: "",
        phone: "",
        profile_pic_path: "",
        education: {
            degree: "",
            school: ""
        },
        grades_honours: "",
        interests_experience: ""

    }, function(err, profile) {
                
        if (err) throw err;
        if (profile) {
            done(null, profile);
        }
    });
}

// Find profile for given a student
ProfileSchema.statics.findProfile = function(emailhash, done) {
        var Profile = this;

        // Search for a profile from the given studInfo
        Profile.findOne({
                'emailhash': emailhash
         }, function(err, profile) {
                if (err) throw err;

                // If a profile is returned, load the given profile
                if (profile) {
                        console.log("SERVER LOG: Profile model op - findProfile success");
                        done(null, profile);
                }
        });
}

var Profile = mongoose.model("Profile", ProfileSchema);
module.exports = Profile;