var config = require('config.json');
const repository = 'offer-types';

var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, {
    native_parser: true
});
db.bind(repository);
/** dati di Mock */
const bootstrapData = require('../mock/' + repository);

var service = {};

function initData() {
    // validation
    const q = Q.defer();
    console.log('finding offerTypes');
    db[repository].find().toArray(function (err, items) {
        console.log('found offerTypes', err, items);
        if (err || items.length == 0) {
            // Insert bootstrapData
            console.log('inserting offerTypes');
            db[repository].insert(bootstrapData, function (err) {
                console.log('inserted offerTypes', err);
                if (err) q.resolve([]);
                else q.resolve(bootstrapData);
            });
        } else {
            q.resolve(items);
        }
    });
    return q.promise;
}

service.getAll = getAll;
service.getById = getById;
service.create = create;
service.update = update;
service.delete = _delete;

module.exports = service;

function getAll() {
    return initData();
}

function getById(_id) {
    const q = Q.defer();
    db[repository].findById(_id, function (err, item) {
        if (err) q.reject('Not Found');
        else q.resolve(item);
    })
    return q.promise;
}

function create(item) {
    delete item['_id'];
    const q = Q.defer();
    db[repository].insert(item, function (err, res) {
        console.log('meta offer insert', arguments);
        if (err || res.insertedCount == 0) q.reject('Error');
        else {
            item._id = res.insertedIds[0];
            q.resolve(item);
        }
    });
    return q.promise;
}

function update(_id, item) {
    const q = Q.defer();
    item._id = _id;
    db[repository].updateById(_id, item, function (err) {
        if (err) q.reject('Error');
        else q.resolve(item);
    })
    return q.promise;
}

function _delete(_id) {
    const q = Q.defer();
    item._id = _id;
    db[repository].deleteById(_id, function (err) {
        if (err) q.reject('Error');
        else q.resolve(true);
    })
    return q.promise;
}