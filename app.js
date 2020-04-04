var http = require('http');
var fs = require('fs');
var express = require("express");
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var passport = require('passport');
var saml = require('passport-saml');
var jwt = require('jsonwebtoken');
var logger = require('morgan');
var path = require('path');
var url = require('url');

var proxy = require('http-proxy-middleware');
var config = require('./' + process.env.CONFIG_FILE);

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

var keys = Object.keys(config.saml);
var samlProviderStrategies = {};

for (var i = 0, length = keys.length; i < length; i++) {
    var samlProvider = keys[i];
    console.log(samlProvider);
    var samlStrategy = new saml.Strategy({
        callbackUrl: config.saml[samlProvider].callbackUrl,
        entryPoint: config.saml[samlProvider].entryPoint,
        issuer: config.saml[samlProvider].issuer,
        identifierFormat: null,
        emailAttribute: config.saml[samlProvider].emailAttribute,
        decryptionPvk: fs.readFileSync(__dirname + '/cert/sp.key.pem', 'utf8'),
        privateCert: fs.readFileSync(__dirname + '/cert/sp.key.pem', 'utf8'),
        cert: fs.readFileSync(__dirname + '/cert/' + samlProvider + '/idp.cert.pem', 'utf8'),
        validateInResponseTo: false,
        disableRequestedAuthnContext: true
    }, function (profile, done) {
        return done(null, profile);
    });
    passport.use(samlProvider, samlStrategy);
    samlProviderStrategies[samlProvider] = samlStrategy;
}

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: config.keys.cookieSigningKeys,
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

function detectSamlProvider(req) {
    const preq = url.parse(req.url, true);
    console.log("preq: " + JSON.stringify(preq));
    var samlProvider = preq.query['provider'];
    var jwt = preq.query['jwt'];

    if (samlProvider === undefined)
        samlProvider = keys[0];

    return samlProvider;
}

function ensureAuthenticated(req, res, next) {
    const preq = url.parse(req.url, true);
    samlProvider = detectSamlProvider(req);

    if (preq.pathname.startsWith('/non-sso/')) return next();
    if (preq.pathname.startsWith('/saml/')) return next();

    if (!req.isAuthenticated()) {
        return res.redirect('/saml/login?provider=' + samlProvider + '&RelayState=' + req.url);
    }

    if (preq.query['jwt'] === undefined) {
        return res.redirect(preq.pathname + '?jwt=' + createToken(req, samlProvider));
    }

    return next();
}

function createToken(req, samlProvider) {
    const samlStrategy = config.saml[samlProvider];
    const emailAttribute = samlStrategy.emailAttribute;
    console.log('req.user: ' + JSON.stringify(req.user));
    const body = { email: req.user[emailAttribute], provider: samlProvider };
    return jwt.sign({ user: req.user }, config.keys.jwtSigningKey);
}

app.all('*', ensureAuthenticated);
var filter = function (pathname, req) {
    return !pathname.match('^/saml');
};

app.use('/', proxy(filter, {
    target: config.proxy.target,
    changeOrigin: true,
    pathRewrite: {
        '^/non-sso/': '/' // rewrite path
    },
    onProxyReq: function (proxyReq, req, res) {
        samlProvider = detectSamlProvider(req);
        const samlStrategy = config.saml[samlProvider];
        const emailAttribute = samlStrategy.emailAttribute;

        var attrs = Object.keys(req.user);
        for (var i = 0, length = attrs.length; i < length; i++) {
            var attrName = attrs[i];
            proxyReq.setHeader('SAML_' + attrName.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '_'), req.user[attrName]);

        }
    }
}));

var sso = function (req, res, next) {
    const preq = url.parse(req.url, true);
    samlProvider = detectSamlProvider(req);
    const samlStrategy = config.saml[samlProvider];
    console.log('samlStrategy: ' + JSON.stringify(samlStrategy));
    const emailAttribute = samlStrategy.emailAttribute;

    passport.authenticate(samlProvider, function (err, user, info) {
        if (err) { return next(err); }
        if (!user) { return res.redirect('/saml/login?provider=' + samlProvider); }
        req.logIn(user, function (err) {
            if (err) { return next(err); }
            console.log('logged-in: ' + JSON.stringify(req.user));
            console.log('RelayState: ' + req.body.RelayState);
            res.redirect(req.body.RelayState || '/');
        });
    })(req, res, next);
}

app.get('/saml/login', sso);
app.post('/saml/login/callback', sso);

app.get('/saml/login/fail',
    function (req, res) {
        res.status(401).send('Login failed');
    }
);

app.get('/saml/metadata',
    function (req, res) {
        const preq = url.parse(req.url, true);
        samlProvider = detectSamlProvider(req);
        res.type('application/xml');
        res.status(200).send(samlProviderStrategies[samlProvider].generateServiceProviderMetadata(fs.readFileSync(__dirname + '/cert/sp.cert.pem', 'utf8')));
    }
);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

