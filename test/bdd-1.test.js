const request = require('request');
const http = require('http');
const express = require('express');
const async = require('async');
const {expect} = require('chai');
let ser1, handler, port = 18081;

/**
 * Executes a test with allowUnauthorized: true
 */

describe('BDD tests - allowUnauthorized set to true', () => {
	
	let testConfig = {
		port: port,
		login_path: '/auth/login',
		failed_path: '/auth/failed',
		secure_path: '/secure',
		logout_path: '/auth/logout',
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
			loginURL: '/loginURL',			// Provides Login interface
			headerName: 'hdx-user',			// header name
			allowUnauthorized: true,
			strategies: [
				{
					object: require('./lib/hardbox-passport-mock'),
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
	
	require('./shared/shared-1.test')(testConfig);
});