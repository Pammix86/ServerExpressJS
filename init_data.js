require('rootpath')();
var express = require('express');
var app = express();
const fs = require('fs');
var config = require('config.json');
const Errors = require('models/Errors');

// init DBSS data
const productsHash = {};

function iterate(children, products, level, parentId, packages) {
    const temp = [...children];
    temp.forEach(function (product) {
        const childDetails = product.childDetails;
        product.parentIds = product.parentIds || [];
        product.childDetails = undefined;
        // SeniorityConstraint
        if (product["SeniorityConstraint"]) {
            product["seniorityConstraintList"] = product["SeniorityConstraint"].split("|");
        } else product["seniorityConstraintList"] = [];
        // packages
        if (level == 2) {
            let packs = product.characteristics ? product.characteristics.filter(function (c) {
                return c.name == "package";
            }) : [];
            if (packs.length > 0 && packs[0].value) {
                packs[0].value.split("|").forEach(function (pack) {
                    packages[pack] = true;
                });
            }
        }
        if (product.id) {
            product['_id'] = product.id;
            delete product.id;
            product.level = level.toString();
        }
        if (parentId && product.parentIds.indexOf(parentId) == -1) {
            product.parentIds.push(parentId);
        }
        if (productsHash[product._id] == undefined) {
            productsHash[product._id] = true;
            products.push(product);
        }
        if (childDetails) {
            iterate(childDetails, products, level + 1, product._id, packages);
        }
    });
}

function transformData(file, data, packages) {
    console.log("transforming", file, data)
    const product = require('./mock_dbss/' + file);
    const products = [product];
    const pkgs = {};
    iterate(products, data, 0, '', pkgs);
    packages.push(...Object.keys(pkgs).map(function (p) {
        return {
            label: p,
            value: p,
            productId: product._id
        };
    }));
    console.log("transformed", file, data);
}




function init() {
    const products = [];
    const packages = [];
    fs.readdirSync('./mock_dbss').forEach(file => {
        const jsonFile = file.split('.')[0];
        transformData(jsonFile, products, packages);
    });
    fs.writeFileSync('./mock/packages.js', "module.exports = " + JSON.stringify(packages, null, 4) + ";");
    fs.writeFileSync('./mock/products-dbss.js', "module.exports = " + JSON.stringify(products, null, 4) + ";");
}

init();