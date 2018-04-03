var config = require('config.json');
const repository = 'products';
const HttpRequest = require('request');

var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionStrings.DBSS, {
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
const bootstrapData = require('../mock/products-dbss');

/** MAPPERS */
function fromSdcToDbssGetProduct(sdc, withLocal) {
    if (!sdc) return null;
    const sdcOrigin = withLocal ? sdc.originalProduct : sdc;
    sdc.originalProduct = undefined;
    const dbss = {};
    dbss.productName = sdcOrigin.name;
    dbss.nmu = sdcOrigin.nmu;
    dbss.modello = sdcOrigin.modello;
    dbss.nmuParent = sdcOrigin.nmuPadre;
    dbss.marca = sdcOrigin.marca;
    dbss.price = sdcOrigin.price;
    dbss.description = sdcOrigin.description;
    dbss.longDescription = sdcOrigin.longDescription;
    dbss.seniorityConstraint = sdcOrigin.seniorityConstraint ? sdcOrigin.seniorityConstraint.join("|") : "";
    dbss.isSellable = sdcOrigin.isSellable ? 'Y' : 'N';
    dbss.offerName = sdcOrigin.offerName;
    dbss.defaultFlag = sdcOrigin.defaultFlag ? 'Y' : 'N';
    dbss.parentDisplayName = sdcOrigin.parentDisplayName;
    if (withLocal) {
        dbss.local = fromSdcToDbssGetProduct(sdc);
    }
    return dbss;
}

var service = {};

function initData() {
    // validation
    // 0) prepare bootstrapData
    // bootstrapData.forEach(function (item) {
    //     if (item._id) {
    //         item._id = mongo.helper.toObjectID(item._id);
    //     }
    // });
    const q = Q.defer();
    // 1) Drop collection Insert bootstrapData
    db[repository].drop(null, function (err) {
        if (err) console.log('Cannot Drop Repository', repository);
        // 2) inset mock data
        db[repository].insertMany(bootstrapData, function (err, res) {
            if (err) console.log('Init Error', repository);
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

function getDateString(d) {
    const s = d.toISOString();
    return s.replace(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)\..*/i, "$2/$3/$1 $4:$5:$6");
}

function getAll(filters, isDbss) {
    /** filters */
    const q = Q.defer();
    const tf = {};
    if (isDbss) {
        const body = {
            "bodyRequestGetProduct": {
                "ProductName": filters.ProductName,
                "NMU": filters.NMU,
                "Modello": filters.Modello,
                "Marca": filters.Marca,
                "NMUPadre": filters.NMUPadre
            }
        };
        const options = {
            url: config.dbssApiHostUrl + config.dbssApiBaseUrl + '/getProduct',
            method: 'POST',
            json: true,
            body: body //JSON.stringify(body)
        };
        const curDate = new Date();
        curDate.setDate(curDate.getDate() + 1);
        options.headers = {
            "Content-Type": "application/json",
            "productType": filters.ProductType,
            "offerType": filters.OfferType,
            "channel": filters.Channel,
            "sourceSystem": config.dbssApiHeaders.sourceSystem,
            "interactionDateTime": getDateString(curDate),
            "messageID": config.dbssApiHeaders.messageID,
            "transactionID": config.dbssApiHeaders.transactionID,
            "businessID": config.dbssApiHeaders.businessID,
        };
        HttpRequest(options, function (err, resp, body) {
            if (err || body.bodyResponse.Result.Result != "OK") {
                q.reject(err || body.bodyResponse.Result.Error.map(function (e) {
                    return e.Description;
                }).join(" ; "));
            } else {
                q.resolve(body.bodyResponse.ProductInfo);
            }
        });
    } else {
        Object.assign(tf, filters);
        if (filters.seniorityConstraintList) {
            const scCond = {
                $or: filters.seniorityConstraintList.map(function (sc) {
                    return {
                        $eq: sc
                    };
                })
            };
            tf.seniorityConstraintList = scCond;
        }
        if (filters.parentIds) {
            tf.parentIds = {
                $all: tf.parentIds
            };
        }
        db[repository].find(tf || {}).toArray(function (err, items) {
            if (err) q.reject('Not Found');
            else q.resolve(items);
        });
    }

    return q.promise;
}

function getById(_id) {
    const q = Q.defer();
    db[repository].findOne({
        _id: _id
    }, function (err, item) {
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
    // proceed with update
    const prod = fromSdcToDbssGetProduct(item, true);
    const body = {
        "bodyRequestSetProduct": {
            "ProductInfo": prod
        }
    };
    const options = {
        url: config.dbssApiHostUrl + config.dbssApiBaseUrl + '/setProduct',
        method: 'POST',
        json: true,
        body: body //JSON.stringify(body)
    };
    const curDate = new Date();
    curDate.setDate(curDate.getDate() + 1);
    options.headers = {
        "Content-Type": "application/json",
        "productType": item.productType,
        "offerType": item.offerType,
        "channel": item.channel,
        "sourceSystem": config.dbssApiHeaders.sourceSystem,
        "interactionDateTime": getDateString(curDate),
        "messageID": config.dbssApiHeaders.messageID,
        "transactionID": config.dbssApiHeaders.transactionID,
        "businessID": config.dbssApiHeaders.businessID,
    };
    HttpRequest(options, function (err, resp, body) {
        if (err || body.bodyResponse.Result.Result != "OK") {
            q.reject(err || body.bodyResponse.Result.Error.map(function (e) {
                return e.Description;
            }).join(" ; "));
        } else {
            q.resolve(prod);
        }
    });
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