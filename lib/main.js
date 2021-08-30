const passport = require('passport');

module.exports = (app, config) => {
	
	passport.serializeUser(config.serializer);
	
	passport.deserializeUser(config.deserializer);
	
	app.use((req, res, next) => {
		//console.log(req.session);
		//console.log('test', req.user);
		next();
	});
	
	app.use(config.secureNamespace, passport.initialize());
	app.use(config.secureNamespace, passport.session());
	// app.use(passport.initialize());
	// app.use(passport.session());
	
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
		next();
	});
	
	config.strategies.forEach((strategy) => {
		if (strategy.object) {
			console.debug('Setting up strategy by object', strategy.config.strategy.config.name);
			strategy.object(app, passport, strategy.config);
		} else {
			console.debug('Setting up strategy by name', strategy.name, strategy.config.strategy.config.name);
			try {
				const s = require(strategy.name);
				s(app, passport, strategy.config);
			} catch(e) {
				console.error(e);
				throw e;
			}
		}
	});
	
	app.use(config.secureNamespace, function (req, res, next) {
		if (!req.user) {
			// console.debug('Unauthorized allowed: ', !config.allowUnauthorized !== true);
			//console.debug('Internal URL: ', !req.internalURL !== true);
			if (config.allowUnauthorized !== true && req.internalURL !== true) {
				/**
				 * @todo Add support for orignal url to be forwarded to login url to redirect back to it after login
				 */
				res.redirect(config.loginURL);
			} else {
				console.debug('Allow unauthorized access on - Letting through');
				next();
			}
		} else {
			next();
		}
	});
	
	// app.use(function (err, req, res, next) {
	// 	if (err instanceof HttpForbidden) {
	// 		req.session.destroy();
	// 		req.logout();
	// 	}
	// 	next(err, req, res);
	// });
	
	app.use(function (req, res, next) {
		if (req.user) {
			res.setHeader(config.headerName, JSON.stringify(req.user));
			//res.proxyHeaders.push([config.headerName, JSON.stringify(req.user)]);
		}
		next(null, req, res);
	});
	
	
	// return function (req, res, cb) {
	//
	// 	config.strategies.forEach((strategy) => {
	// 		let s;
	// 		if(strategy.object) {
	// 			s = strategy.object(strategy.config, passport, app);
	// 		} else {
	// 			s = require(strategy.name)(strategy.config, passport, app);
	// 		}
	// 	});
	//
	// 	app.use(function (err, req, res, next) {
	// 		if (err instanceof HttpForbidden) {
	// 			req.session.destroy();
	// 			req.logout();
	// 		}
	// 		cb(err, req, res);
	// 	});
	//
	// 	app.use(function (req, res, next) {
	// 		if (req.user) {
	// 			res.setHeader(config.headerName, JSON.stringify(req.user));
	// 			//res.proxyHeaders.push([config.headerName, JSON.stringify(req.user)]);
	// 		}
	// 		cb(null, req, res);
	// 	});
	//
	// 	app(req, res);
	// };
};