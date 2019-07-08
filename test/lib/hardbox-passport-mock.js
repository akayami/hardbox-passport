const Strategy = require('passport-mock-strategy');
const express = require('express');
const bodyParser = require('body-parser');

module.exports = (app, passport, config) => {
	//const app = express();
	
	app.use(require('body-parser').urlencoded({extended: true}));

	passport.use(
		new Strategy(

			config.strategy.config,

			function (cred, done) {
				//console.log(cred);
				config.authenticate(cred, (err, result, message) => {
					//console.log(cred);
					if (err) {
						return done(err);
					} else if (result !== false) {
						return done(null, result);
					} else {
						return done(null, false, {message: 'Incorrect Login'});
					}
				});
			}
		)
	);

	//passport.use(new Strategy(config.strategy.config, config.strategy.authenticate));

	
	app.use(config.handlerURL, bodyParser.urlencoded({extended: false}));
	app.use(config.handlerURL, passport.initialize());
	app.use(config.handlerURL, passport.session());

	app.post(config.handlerURL, passport.authenticate('mock', config.auth_options));
	
};