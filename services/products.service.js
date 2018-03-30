var config = require('config.json');
const repository = 'products';

var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionStrings.SDC, {
    native_parser: true
});

const dbssService = require('./products-dbss.service');

function fromDbssToSdc(dbss) {
    const sdc = {};
    let availableRates = dbss.characteristics ? dbss.characteristics.filter(function (c) {
        return c.name == "InstallmentNumberFixed";
    }) : [];
    if (availableRates.length > 0) {
        availableRates = availableRates[0].domain ? availableRates[0].domain.split("|") : [];
    }

    sdc._id = dbss._id;
    sdc.name = dbss.displayName;
    sdc.description = dbss.description;
    sdc.longDescription = dbss.longDescription;
    sdc.level = dbss.level;
    sdc.parentIds = dbss.parentIds;
    sdc.classe = dbss.class;
    sdc.subclass = dbss.subClassType;
    sdc.productType = dbss.productType;
    sdc.channel = dbss.channel;
    sdc.offerType = dbss.offerType;
    sdc.cus = dbss.cus;
    sdc.paymentMethod = dbss.paymentMethod;
    sdc.nmu = dbss.NMU;
    sdc.nmuPadre = dbss.NMUPadre;
    sdc.marca = dbss.marca;
    sdc.modello = dbss.modello;
    sdc.price = dbss.prezzo;
    sdc.isSellable = dbss.isSellable;
    sdc.regalabile = dbss.regalabile;
    sdc.offerName = dbss.ccOfferName;
    sdc.availableRates = availableRates;
    return sdc;
}

function fromDbssGetProductToSdc(_dbss, productType, offerType, channel, setOriginal) {
    const sdc = {};
    const dbss = setOriginal ? _dbss.local : _dbss;
    sdc._id = dbss.productName;
    sdc.name = dbss.productName;
    sdc.nmu = dbss.nmu;
    sdc.modello = dbss.modello;
    sdc.nmuPadre = dbss.nmuParent;
    sdc.marca = dbss.marca;
    sdc.price = dbss.price;
    sdc.productType = productType;
    sdc.channel = channel;
    sdc.offerType = offerType;
    sdc.description = dbss.description;
    sdc.longDescription = dbss.longDescription;
    sdc.seniorityConstraint = dbss.seniorityConstraint ? dbss.seniorityConstraint.split("|") : [];
    sdc.isWebSellable = dbss.isSellable && dbss.isSellable == 'Y' ? true : false;
    sdc.offerName = dbss.offerName;
    sdc.defaultFlag = dbss.defaultFlag && dbss.defaultFlag == 'Y' ? true : false;
    sdc.parentDisplayName = dbss.parentDisplayName;
    if (setOriginal) sdc.originalProduct = fromDbssGetProductToSdc(_dbss, productType, offerType, channel);
    return sdc;
}

const repo = db.bind(repository);
repo.bind({
    findAndUpdateById: function (id, update, callback) {
        return this.findOneAndUpdate({
            //_id: mongo.helper.toObjectID(id)
            _id: id
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

const productTypes = {
    'Bene Fisico': 'BF',
    'Carta Servizi': 'CS',
    'SIM': 'SIM',
    'Ricarica': 'Ricarica',
    'All': 'ALL'
};

function getAll(filters) {
    const tf = {};
    let isDbss = false;
    if (filters.level == "0") {
        tf.level = "0";
        tf.class = "OFFERTA";
        tf.subClassType = "OFFERTA";
    } else if (filters.level == "1") {
        tf.level = "1";
        tf.class = "SERVIZIO_ABILITANTE";
    } else if (filters.level == "2") {
        tf.level = "2";
        tf.class = "ELEMENTO_ABILITATO";
    } else if (filters.level == "3") {
        tf.level = "3";
        // TODO
    } else if (filters.level == "4") {
        tf.level = "4";
        // TODO
    } else {
        // getProducts standard
        isDbss = true;
        tf.ProductName = filters.productName;
        tf.ProductType = filters.productType ? productTypes[filters.productType] || undefined : undefined;
        tf.Channel = (filters.channel || '').toUpperCase();
        tf.OfferType = (filters.offerType || '').toUpperCase();
        tf.NMU = filters.nmu;
        tf.NMUPadre = filters.nmuPadre;
        tf.Marca = filters.marca;
        tf.Modello = filters.modello;
    }
    if (filters.seniorityConstraint instanceof Array && filters.seniorityConstraint.length > 0) {
        tf["seniorityConstraintList"] = [...filters.seniorityConstraint];
    }
    if (filters.parentId) {
        tf.parentIds = [filters.parentId];
    }

    const q = Q.defer();
    dbssService.getAll(tf, isDbss)
        .then(function (items) {
            q.resolve(items.map(function (o) {
                if (isDbss) return fromDbssGetProductToSdc(o, tf.ProductType, tf.OfferType, tf.Channel, true);
                else return fromDbssToSdc(o);
            }))
        })
        .catch(function (err) {
            q.reject(err);
        });
    return q.promise;
}

function getById(_id) {
    const q = Q.defer();
    dbssService.getById(_id).then(function (item) {
        q.resolve(fromDbssToSdc(item));
    }).catch(function (err) {
        q.reject(err);
    });
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
    dbssService.update(_id, item)
        .then(function (_item) {
            q.resolve(fromDbssGetProductToSdc(_item, item.productType, item.offerType, item.channel, true));
        })
        .catch(function (err) {
            q.reject(err);
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