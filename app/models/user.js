var mongoose = require('mongoose');
var hash = require('../util/hash');
var uuid = require('../util/generateUUID');


UserSchema = mongoose.Schema({
        firstName: String,
        lastName: String,
        displayName: String,
        utype: String,
        email: String,
        salt: String,
        hash: String,
        emailhash: String,
        facebook: {
                id: String,
                email: String,
                name: String
        },
        google: {
                id: String,
                email: String,
                name: String
        }
});


UserSchema.statics.signup = function(utype, email, password, emailhash, done) {
        var User = this;
        
        hash(password, function(err, salt, hash) {
                if (err) throw err;
                // if (err) return done(err);
                User.create({
                        utype: utype,
                        email: email,
                        displayName: email.split("@")[0],
                        salt: salt,
                        hash: hash,
                        emailhash: emailhash,
                }, function(err, user) {
                        if (err) throw err;
                        // if (err) return done(err);
                        done(null, user);
                });
        });

}

UserSchema.statics.isValidUserPassword = function(email, password, done) {
        this.findOne({
                email: email
        }, function(err, user) {
                // if(err) throw err;
                if (err) return done(err);
                if (!user) return done(null, false, {
                        message: 'Incorrect email.'
                });
                hash(password, user.salt, function(err, hash) {
                        if (err) return done(err);
                        if (hash == user.hash) return done(null, user);
                        done(null, false, {
                                message: 'Incorrect password'
                        });
                });
        });
};

// Create a new user given a profile
UserSchema.statics.findOrCreateOAuthUser = function(profile, done) {
        var User = this;

        // Build dynamic key query
        var query = {};
        query[profile.authOrigin + '.id'] = profile.id;

        // Search for a profile from the given auth origin
        User.findOne(query, function(err, user) {
                if (err) throw err;

                // If a user is returned, load the given user
                if (user) {
                        done(null, user);
                } else {
                        // Otherwise, store user, or update information for same e-mail
                        User.findOne({
                                'email': profile.emails[0].value
                        }, function(err, user) {
                                if (err) throw err;

                                if (user) {
                                        // Preexistent e-mail, update
                                        user['' + profile.authOrigin] = {};
                                        user['' + profile.authOrigin].id = profile.id;
                                        user['' + profile.authOrigin].email = profile.emails[0].value;
                                        user['' + profile.authOrigin].name = profile.displayName;

                                        user.save(function(err, user) {
                                                if (err) throw err;
                                                done(null, user);
                                        });
                                } else {
                                        // New e-mail, create

                                        var emailhash = uuid.generateUUID();

                                        // Fixed fields
                                        user = {
                                                utype: "Donor",
                                                email: profile.emails[0].value,
                                                displayName: profile.displayName,
                                                emailhash: emailhash,
                                                firstName: profile.displayName.split(" ")[0],
                                                lastName: profile.displayName.replace(profile.displayName.split(" ")[0] + " ", "")
                                        };

                                        // Dynamic fields
                                        user['' + profile.authOrigin] = {};
                                        user['' + profile.authOrigin].id = profile.id;
                                        user['' + profile.authOrigin].email = profile.emails[0].value;
                                        user['' + profile.authOrigin].name = profile.displayName;

                                        User.create(
                                                user,
                                                function(err, user) {
                                                        if (err) throw err;
                                                        done(null, user);
                                                }
                                        );

                                }
                        });
                }
        });
}

var User = mongoose.model("User", UserSchema);
module.exports = User;
