const request = require('request');
const http = require('http');
const express = require('express');
const {expect} = require('chai');
let ser1, handler, port = 18081;


describe('BDD tests - Same as base tests but using name instead of object', () => {
	
	let testConfig = {
		port: port,
		login_ui_url: '/loginURL',
		login_path: '/auth/login',
		failed_path: '/auth/failed',
		secure_path: '/secure',
		logout_path: '/auth/logout',
		secure_default_path: '/secure/default',
		cred_valid: true,
	};
	
	beforeEach((done) => {
		
		const app = express();
		
		require('hardbox-session')(app, {
			secret: 'keyboard cat',
			resave: false,
			saveUninitialized: true
		});
		
		
		require('../lib/main')(app, {
			serializer: (user, done) => {
				done(null, user);
			},
			deserializer: (obj, done) => {
				done(null, obj);
			},
			secureNamespace: testConfig.secure_path,
			passport: {
				authenticate: {
					failureRedirect: '/login'	// This is where user is redirected when login fails
				}
			},
			logoutURL: testConfig.logout_path,			// Triggers logout sequence
			loginURL: testConfig.login_ui_url,			// Provides Login interface
			headerName: 'hdx-user',			// header name
			strategies: [
				{
					name: __dirname + '/lib/hardbox-passport-mock',
					config: {
						strategy: {
							config: {
								name: 'mock',
								user: {
									customer: 'ok'
								}
							},
						},
						authenticate: (cred, cb) => {			// This is a plugable authentication function
							//cb(null, false, {message: 'Incorrect Login'})
							if(testConfig.cred_valid !== true) {
							//if (cred.customer === 'fail') {
								cb(null, false, {message: 'Incorrect Login'});
							} else {
								cb(null, cred);
							}
						},
						handlerURL: testConfig.login_path,
						auth_options: {
							failureRedirect: testConfig.failed_path
						}
					}
				}
			]
		});
		
		app.use((req, res, next) => {
			res.status(200).end();
			next();
		});
		
		app.use((err, req, res, next) => {
			if(err.code) res.status(err.code);
			res.write(err.message);
			res.end();
			next();
		});

		const handler = (req, res) => {
			app(req, res);
		};

		ser1 = require('http').createServer(handler).listen(port, (err) => {
			if (err) return done(err);
			done();
		});
	});

	afterEach(() => {
		if (ser1) ser1.close();
	});

	require('./shared/shared.test')(testConfig);
});