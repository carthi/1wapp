var User = require('../app/models/user');
var Profile = require('../app/models/profile');
var UserCtrlr = require('../app/controllers/user');
var Auth = require('./middlewares/authorization.js');
var uuid = require('../app/util/generateUUID');


module.exports = function(app, passport){
        app.get("/", function(req, res){ 
                if(req.isAuthenticated()){
                    
                    UserCtrlr.findUsers("Student", function(studArr){
                      //if(err) throw err;
                      //console.log("SERVER LOG: " + studArr);
                      res.render("home", { user : req.user, studList : studArr });
                    });
                
                }else{
                    res.render("home", { user : null});
                    //UserCtrlr.findUsers("Student", function(studArr){
                    //  res.render("home", { user : null, studList : studArr });
                    //});
                }
        });

        app.get("/login", function(req, res){ 
                res.render("login");
        });

        app.post("/login" 
                ,passport.authenticate('local',{
                        successRedirect : "/",
                        failureRedirect : "/login",
                })
        );

        app.get("/signup", function (req, res) {
                res.render("signup");
        });

        app.post("/signup", Auth.userExist, function (req, res, next) {

            var emailhash = uuid.generateUUID();
            User.signup("Donor", req.body.email, req.body.password, emailhash, function(err, user){
                
                if(err) throw err;
                req.login(user, function(err){
                    if(err) return next(err);
                    return res.redirect("user");
                });
            });
        });

        app.post("/studSignup", Auth.userExist, function (req, res, next) {

            var emailhash = uuid.generateUUID();
            User.signup("Student", req.body.email, req.body.password, emailhash, function(err, user){
                        
                if(err) throw err;

                Profile.signup(emailhash, function(err, user){
                    if(err) throw err;
                });

                req.login(user, function(err){
                    if(err) return next(err);
                    return res.redirect("user");
                });
            });
        });

        app.get("/auth/facebook", passport.authenticate("facebook",{ scope : "email"}));
        app.get("/auth/facebook/callback", 
                passport.authenticate("facebook",{ failureRedirect: '/login'}),
                function(req,res){
                        res.render("user", {user : req.user});
                }
        );

        app.get('/auth/google',
          passport.authenticate(
                  'google',
                  {
                          scope: [
                          'https://www.googleapis.com/auth/userinfo.profile',
                          'https://www.googleapis.com/auth/userinfo.email'
                          ]
                  })
          );

        app.get('/oauth2callback', 
          passport.authenticate('google', { failureRedirect: '/login' }),
          function(req, res) {
            // Successful authentication, redirect home.
            res.redirect('/');
          });

        app.get("/user", Auth.isAuthenticated , function(req, res){ 
            res.render("user", { user : req.user});
        });

        app.put("/user", Auth.isAuthenticated , function(req, res){ 
            res.render("user", { user : req.user});

            console.log("SERVER LOG: Update User Info for " + req.user.fistName);

            if (!req.body.name || typeof req.body.value === 'undefined') return res.send(400, JSON.stringify({'error':'incomplete request'}));
            req.user[req.body.name] = req.body.value;
            req.user.save( function () {
                res.send(200, JSON.stringify({'success':'User modified'}))
            });

        });

        app.get("/profile/:pid", Auth.isAuthenticated , function(req, res){ 

            console.log("SERVER LOG: GET Profile ID " + req.params.pid);

            if (!req.qProfile) return res.send(404, JSON.stringify({'error':'profile not found'}));
            console.log("SERVER LOG: Returned Profile - " + req.qProfile);

            if (req.user.utype == "Donor")
                res.render("profile", { user : req.user, profile : req.qProfile, profileinfo : req.qProfileInfo });
            else {  // User is Student - allow editing own profile
                
                console.log("SERVER LOG: User - " + req.user.emailhash);
                console.log("SERVER LOG: ProfileInfo - " + req.qProfileInfo.emailhash);

                if (req.user.emailhash == req.qProfileInfo.emailhash)
                    res.render("xe-profile", { user : req.user, profile : req.qProfile, profileinfo : req.qProfileInfo });
                else
                    res.render("profile", { user : req.user, profile : req.qProfile, profileinfo : req.qProfileInfo });
            }

        });

        app.put("/profile/:pid", Auth.isAuthenticated , function(req, res){ 

            console.log("SERVER LOG: Update Profile ID " + req.params.pid);

            if (!req.qProfile) return res.send(404, JSON.stringify({'error':'profile not found'}));
            if (!req.body.name || typeof req.body.value === 'undefined') return res.send(400, JSON.stringify({'error':'incomplete request'}));
            req.qProfile[req.body.name] = req.body.value;
            req.qProfile.save( function () {
                res.send(200, JSON.stringify({'success':'profile modified'}))
            });

        });

        app.param('pid', Auth.isAuthenticated , function (req, res, next, emailhash){
            
            console.log("SERVER LOG: app.param " + req.params.pid);

            User.findOne({ emailhash : emailhash }, function (err, user) {
                if (err) return next(err);
                if (!user) return next(); //new Error('Failed to load user ' + req.param.pid));
                req.qProfileInfo = user;
            });

            Profile.findOne({ emailhash : emailhash }, function (err, profile) {
                if (err) return next(err);
                if (!profile) return next(); //new Error('Failed to load profile ' + req.param.pid));
                req.qProfile = profile;
                next();
            });

        });

        app.get('/logout', function(req, res){
                req.logout();
                res.redirect('/login');
        });
}