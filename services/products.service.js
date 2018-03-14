﻿var config = require('config.json');
const repository = 'products';

var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, {
    native_parser: true
});

const repo = db.bind(repository);
repo.bind({
    findAndUpdateById: function (id, update, callback) {
        return this.findOneAndUpdate({
            _id: mongo.helper.toObjectID(id)
        }, {
            $set: update
        }, {
            returnOriginal: false
        }, callback);
    }
});

/** dati di Mock */
const bootstrapData = require('../mock/' + repository);

var service = {};

function initData() {
    // validation
    const q = Q.defer();
    // 1) Drop collection Insert bootstrapData
    db[repository].drop(null, function (err) {
        if (err) q.reject('Drop error');
        // 2) inset mock data
        db[repository].insertMany(bootstrapData, function (err, res) {
            if (err) q.reject('Init error');
            else q.resolve(res.ops);
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

function getAll(filters) {
    const q = Q.defer();
    db[repository].find(filters || {}).toArray(function (err, items) {
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
    delete item._id;
    db[repository].findAndUpdateById(_id, item,
        function (err, res) {
            if (err) q.reject('Error');
            else q.resolve(res.value);
        }
    );
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