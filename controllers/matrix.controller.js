const Errors = require('models/Errors');
const _ = require('lodash');
var config = require('config.json');
var express = require('express');
var router = express.Router();
var service = require('services/matrix.service');

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
    const filters = Object.assign({}, req.query);
    //check delle seniority
    service.getAll(filters)
        .then(function (items) {
            if (filters.idMO) {
                res.json(items);
            } else {
                res.json(items.map(function (o) {
                    return _.omit(o, '_id');
                }));
            }
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
    // 1) verifichiamo che non ci siano delle matrici con parametri uguali
    const filter = {};
    filter.idMO = req.body.idMO;
    filter.productL0 = req.body.productL0;
    filter.coverageBB = req.body.coverageBB;
    filter.coverageUBB = req.body.coverageUBB;
    filter.coverageUBBH = req.body.coverageUBBH;
    console.log('create', req.body);
    service.getAll(filter)
        .then(function (items) {
            if (items && items.length == 0) {
                // 1) inseriamo la matrice
                service.create(req.body)
                    .then(function (item) {
                        res.json(item);
                    })
                    .catch(function (err) {
                        next(err);
                    });
            } else {
                next("DUPLICATED_VALUES");
            }
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