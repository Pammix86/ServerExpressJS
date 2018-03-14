const Errors = require('models/Errors');

var config = require('config.json');
var express = require('express');
var router = express.Router();
var service = require('services/actions.service');

// routes
router.get('/init', init);
router.get('/', getAll);
router.post('/', create);
router.get('/:_id', getCurrent);
router.put('/:_id', update);
router.delete('/:_id', _delete);

module.exports = router;

function init() {
    service.init()
        .then(function (items) {
            res.json(items);
        })
        .catch(function (err) {
            next(err);
        });
}

function getAll(req, res, next) {
    service.getAll()
        .then(function (items) {
            res.json(items);
        })
        .catch(function (err) {
            next(err);
        });
}

function getCurrent(req, res, next) {
    service.getById(req.params._id)
        .then(function (item) {
            if (item) {
                res.json(item);
            } else {
                throw new Errors.NotFoundError('Not Found');
            }
        })
        .catch(function (err) {
            next(err);
        });
}

function update(req, res, next) {
    service.update(req.params._id, req.body)
        .then(function (item) {
            res.json(item);
        })
        .catch(function (err) {
            next(err);
        });
}

function create(req, res, next) {
    console.log('create', req.body);
    service.create(req.body)
        .then(function (item) {
            res.json(item);
        })
        .catch(function (err) {
            next(err);
        });
}

function _delete(req, res, next) {
    service.delete(req.params._id)
        .then(function (deleted) {
            if (deleted) res.json(true);
            else throw new Errors.BadRequestError('Cannot delete');
        })
        .catch(function (err) {
            next(err);
        });
}