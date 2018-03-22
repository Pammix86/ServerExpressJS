var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionStrings.SDC, {
    native_parser: true
});
db.bind('users');

var service = {};

service.login = authenticate;
service.logout = logout;
service.signUp = signUp;
service.checkLogin = checkLogin;

module.exports = service;

function authenticate(authRequest) {
    var deferred = Q.defer();
    const username = authRequest.username;
    const password = authRequest.password;

    db.users.findOne({
        username: username
    }, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user && bcrypt.compareSync(password, user.hash)) {
            // authentication successful
            const _user = {
                _id: user._id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
            };
            deferred.resolve({
                token: jwt.sign(
                    _user,
                    config.secret, {
                        subject: user._id,
                    }
                )
            });
        } else {
            // authentication failed
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function logout(authRequest) {
    // TODO, per ora effettuiamo sempre il log-out
    return Q.resolve(true);
}

function signUp(authRequest) {
    // TODO
    return Q.reject('Not Implemented');
}

function checkLogin(authRequest) {
    // TODO
    return Q.reject('Not Implemented');
}