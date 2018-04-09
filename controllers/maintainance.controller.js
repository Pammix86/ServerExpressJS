const Errors = require('models/Errors');

var config = require('config.json');
var express = require('express');
var router = express.Router();
// var service = require('services/actions.service');

// routes
router.get('/check-status', checkStatus);

module.exports = router;

function checkStatus(req, res, next) {
    res.json(false);
}