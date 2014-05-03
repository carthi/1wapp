var mongoose = require('mongoose')
  , User = mongoose.model('User');

exports.index = function(req, res, next){

}

// Find Students
exports.findUsers = function(userType, callback) {

        User.find().where("utype", userType).exec(function(err, results) {
                if (err) throw err;
                callback(results);
        });
}