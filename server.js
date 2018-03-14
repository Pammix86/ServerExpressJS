require('rootpath')();
var express = require('express');
var app = express();
const fs = require('fs');
var cors = require('cors');
var bodyParser = require('body-parser');
var expressJwt = require('express-jwt');
var config = require('config.json');
const Errors = require('models/Errors');

app.use(cors());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

// use JWT auth to secure the api, the token can be passed in the authorization header or querystring
function jwtGetTokenCallback(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        return req.query.token;
    }
    return null;
}
app.use(expressJwt({
    secret: config.secret,
    getToken: jwtGetTokenCallback
}).unless({
    path: ['/login', '/sign-up', '/logout', '/users']
}));

// routes
// Authentication
// app.use('', require('./controllers/authentication.controller'));
// // Users
// app.use('/users', require('./controllers/users.controller'));
// // Meta Offers
// app.use('/meta-offers', require('./controllers/meta-offers.controller'));
// // Seniorities
// app.use('/meta-offers', require('./controllers/meta-offers.controller'));

// Add routes dinamically
const skipRoutes = {
    'authentication': ''
}
fs.readdirSync('./controllers').forEach(file => {
    const controllerRoute = file.split('.')[0];
    console.log('Adding routes for ' + controllerRoute);
    const route = controllerRoute in skipRoutes ? skipRoutes[controllerRoute] : controllerRoute;
    app.use('/' + route, require('./controllers/' + controllerRoute + '.controller'));
})

// Error Handling
app.use(errorHandler);

function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    console.log('handling error', err);
    if (err instanceof Errors.IError) {
        res.status(err.code).json(err);
    } else {
        res.status(500).json(new Errors.InternalServerError((err || '').toString()));
    }
}

// start server
var port = process.env.NODE_ENV === 'production' ? 80 : 4000;
var server = app.listen(port, function () {
    console.log('Server listening on port ' + port);
});