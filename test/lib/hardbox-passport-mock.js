const Strategy = require('passport-mock-strategy');
const express = require('express');
const bodyParser = require('body-parser');

module.exports = (config, passport) => {
	const app = express();

	passport.use(
		new Strategy(

			config.strategy.config,

			function (cred, done) {
				//console.log(cred);
				config.authenticate(cred, (err, result, message) => {
					//console.log(cred);
					if (err) {
						return done(err);
					} else if (result) {
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

	return (req, res, cb) => {
		app(req, res);
		cb(null, req, res);
	}
};