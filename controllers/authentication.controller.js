const Errors = require('models/Errors');

var config = require('config.json');
var express = require('express');
var router = express.Router();
var userService = require('../services/user.service');
const service = require('../services/authentication.service');

// routes
router.post('/login', login);
router.post('/logout', logout);
router.post('/check-login', checkLogin);
router.post('/sign-up', signUp);

module.exports = router;

function signUp(req, res, next) {
    service.signUp(req.body)
        .then(function (user) {
            if (user) {
                // authentication successful
                res.send(user);
            } else {
                // authentication failed
                throw new Errors.BadRequestError('Username and Password are not valid');
            }
        }).catch(function (err) {
            next(err);
        });
}

function login(req, res, next) {
    console.log(req);
    service.login(req.body)
        .then(function (user) {
            if (user) {
                // authentication successful
                res.send(user);
            } else {
                // authentication failed
                throw new Errors.BadRequestError('Username and Password are not valid');
            }
        }).catch(function (err) {
            next(err);
        });
}

function logout(req, res, next) {
    service.logout()
        .then(function (loggedOut) {
            res.send(loggedOut);
        })
        .catch(function (err) {
            next(err);
        });
}

function checkLogin(req, res, next) {
    var token = req.headers.authorization;
    service.checkLogin(token)
        .then(function (loggedIn) {
            if (loggedIn) res.sendStatus(200);
            else throw new Error.UnauthorizedError("Invalid Token");
        })
        .catch(function (err) {
            next(err);
        });
}