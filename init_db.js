require('rootpath')();
var express = require('express');
var app = express();
const fs = require('fs');
var config = require('config.json');
const Errors = require('models/Errors');

function init() {
    fs.readdirSync('./services').forEach(file => {
        const serviceName = file.split('.')[0];
        console.log('Loading service', serviceName);
        const serviceInstance = require('./services/' + serviceName + '.service');
        console.log('initializing db data for service', serviceName);
        if(serviceInstance.init) serviceInstance.init();
    });
}

init();