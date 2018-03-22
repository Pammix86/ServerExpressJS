var config = require('config.json');
const repository = 'seniorities';

var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionStrings.SDC, {
    native_parser: true
});
db.bind(repository);
/** dati di Mock */
const bootstrapData = require('../mock/' + repository);

var service = {};

function initData() {
    // validation
    // 0) prepare bootstrapData
    bootstrapData.forEach(function (item) {
        if (item._id) {
            item._id = mongo.helper.toObjectID(item._id);
        }
    });
    const q = Q.defer();
    // 1) Drop collection Insert bootstrapData
    db[repository].drop(null, function (err) {
        if (err) console.log('Cannot Drop Repository', repository, err);
        // 2) inset mock data
        db[repository].insertMany(bootstrapData, function (err, res) {
            if (err) console.log('Init Error', repository, err);
            q.resolve();
        });
    })
    return q.promise;
}

service.init = initData;
service.getAll = getAll;
service.getById = getById;
service.create = create;
service.update = update;
service.delete = _delete;

module.exports = service;

function getAll() {
    const q = Q.defer();
    db[repository].find().toArray(function (err, items) {
        if (err) q.reject('Not Found');
        else q.resolve(items);
    });
    return q.promise;
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
    db[repository].removeById(_id, function (err) {
        if (err) q.reject('Error');
        else q.resolve(true);
    })
    return q.promise;
}