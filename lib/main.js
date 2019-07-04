const passport = require('passport');
const express = require('express');

module.exports = (config) => {

	const app = express();

	passport.serializeUser(config.serializer);

	passport.deserializeUser(config.deserializer);

	app.use(config.secureNamespace, passport.initialize());
	app.use(config.secureNamespace, passport.session());

	// config.strategies.forEach((strategy) => {
	// 	let s = require(strategy.name)(strategy.config, passport);
	//
	// });

	// app.use(config.local.login.loginURL, passport.initialize());
	// app.use(config.local.login.loginURL, passport.session());

	app.use((req, res, next) => {
		req.session.views = (req.session.views || 0) + 1;
		res.append('session-view-count', req.session.views);
		next();
	});

	app.get(config.logoutURL, function (req, res, next) {
		console.debug('Logout Handler');
		req.internalURL = true;
		req.session.destroy();
		req.logout();
		res.redirect(config.loginURL);
	});

	app.use(config.secureNamespace, function (req, res, next) {
		if (!req.user) {
			console.debug('No User Session');
			console.debug('Unauthorized allowed: ', !config.allowUnauthorized !== true);
			console.debug('Internal URL: ', !req.internalURL !== true);
			if (config.allowUnauthorized !== true && req.internalURL !== true) {
				console.debug('Redirecting...' + config.loginURL);
				res.redirect(config.loginURL);
			} else {
				console.debug('Allow unauthorized access on - Letting through');
				next();
			}
		} else {
			next();
		}
	});


	return function (req, res, cb) {

		config.strategies.forEach((strategy) => {
			let s;
			if(strategy.object) {
				s = strategy.object(strategy.config, passport);
			} else {
				s = require(strategy.name)(strategy.config, passport);
			}
			s(req, res, (err, req, res) => {
				//console.log('here');

				if(err) return console.error(err);
				//console.log('Passport Setup Completed');
			});
		});

		app.use(function (err, req, res, next) {
			if (err instanceof HttpForbidden) {
				req.session.destroy();
				req.logout();
			}
			cb(err, req, res);
		});

		app.use(function (req, res, next) {
			if (req.user) {
				res.setHeader(config.headerName, JSON.stringify(req.user));
				//res.proxyHeaders.push([config.headerName, JSON.stringify(req.user)]);
			}
			cb(null, req, res);
		});
		app(req, res);
	};
};