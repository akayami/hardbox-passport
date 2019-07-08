const request = require('request');
const http = require('http');
const express = require('express');
const async = require('async');
const {expect} = require('chai');
let ser1, handler, port = 18081;


//const mock = require('./lib/hardbox-passport-mock');

// ({
// 	strategy: {
// 		config: {
// 			name: 'mock',
// 			user: {
// 				id: 10,
// 				customer: 'Tomasz'
// 			}
// 		},
// 	},
// 	authenticate: (cred, cb) => {			// This is a plugable authentication function
// 		if (cred.customer === 'fail') {
// 			cb(null, false, {message: 'Incorrect Login'});
// 		} else {
// 			cb(null, {profile: 'Some User'});
// 		}
// 	},
// });

describe("BDD tests", () => {

	let user = {
		customer: 'ok'
	};
	const login_path = '/auth/login';
	const failed_path = '/auth/failed';
	const secure_path = '/secure';
	const logout_path = '/auth/logout';

	beforeEach((done) => {
		
		const app = express();
		// app.use((q, r, n) => {
		// 	console.log('HJere')
		// 	n();
		// });
		
		// app.post(login_path, (req, res, next) => {
		// 	console.log('POST');
		// 	next();
		// });
		
		app.get('/secure', (req, res, next) => {
			next();
		});
		
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
			secureNamespace: secure_path,
			passport: {
				authenticate: {
					failureRedirect: '/login'	// This is where user is redirected when login fails
				}
			},
			logoutURL: logout_path,			// Triggers logout sequence
			loginURL: '/loginURL',			// Provides Login interface
			headerName: 'hdx-user',			// header name
			strategies: [
				{
					name: __dirname + '/lib/hardbox-passport-mock',
					config: {
						strategy: {
							config: {
								name: 'mock',
								user: user
								// user: {
								// 	id: 10,
								// 	customer: 'Tomasz'
								// }
							},
						},
						authenticate: (cred, cb) => {			// This is a plugable authentication function
							//cb(null, false, {message: 'Incorrect Login'});
							if (cred.customer === 'fail') {
								cb(null, false, {message: 'Incorrect Login'});
							} else {
								cb(null, cred);
							}
						},
						handlerURL: login_path,
						auth_options: {
							failureRedirect: failed_path
						}
					}
				},
				// {
				// 	object: require('../../hardbox-passport-local'),
				// 	//name: 'hardbox-passport-local',
				// 	config: {
				// 		strategy: {
				// 			config:	{
				// 				fields: ['customer', 'email', 'password']
				// 			}
				// 		},
				// 		// strategyConfig: {
				// 		// 	fields: ['customer', 'email', 'password']
				// 		// },
				// 		authenticate: (credentials, cb) => {
				// 			if (credentials.customer === 'fail') {
				// 				cb(null, false, {message: 'Incorrect Login'});
				// 			} else {
				// 				cb(null, {profile: 'Some User'});
				// 			}
				// 		},
				// 		local: {
				// 			login: {
				// 				loginURL: login_path
				// 			}
				// 		},
				// 		auth_options: {
				// 			failureRedirect: failed_path
				// 		}
				// 	},
				// }
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
			
			// require('hardbox-session')({
			// 	secret: 'keyboard cat',
			// 	resave: false,
			// 	saveUninitialized: true
			// })(req, res, (err, req, res) => {
			// 	console.log('here2');
			// 	h(req, res, (err, req, res) => {
			// 		console.log('here3');
			// 		//console.debug('END');
			// 		res.end();
			// 	});
			// });
		};

		ser1 = require('http').createServer(handler).listen(port, (err) => {
			if (err) return done(err);
			done();
		});
	});

	afterEach(() => {
		if (ser1) ser1.close();
	});

	it('Needs to initialize', (done) => {
		done();
	});

	it('Login Success', (done) => {
		user.customer = 'ok';
		async.series([
			(cb) => {
				require('request')({
					url: `http://localhost:${port}${login_path}`,
					method: 'POST',
					form: {
						customer: 'user',
						email: 'email',
						password: 'password'
					}
				}, (err, res, body) => {
					expect(res.statusCode).equal(200);
					//expect(res.headers.location).equal(login_path);
					return cb(err);
				});
			}
		], (err, res) => {
			if (err) return done(err);
			done();
		});
	});


	it('Login Failed', (done) => {
		user.customer = 'fail';
		async.series([
			(cb) => {
				require('request')({
					url: `http://localhost:${port}${login_path}`,
					method: 'POST',
					form: {
						customer: 'fail',
						email: 'email',
						password: 'password'
					}
				}, (err, res, body) => {
					expect(res.statusCode).equal(302);
					expect(res.headers.location).equal(failed_path);
					return cb(err);
				});
			}
		], (err, res) => {
			if (err) return done(err);
			done();
		});
	});

	it('No Login', (done) => {
		user.customer = 'ok';
		async.series([
			(cb) => {
				require('request')({
					url: `http://localhost:${port}${secure_path}`,
					method: 'GET',
					followRedirect: false
				}, (err, res, body) => {
					expect(res.statusCode).equal(302);
					expect(res.headers.location).equal('/loginURL');
					return cb(err);
				});
			}
		], (err, res) => {
			if (err) return done(err);
			done();
		});
	});

	it('Access Secure When Authorized', (done) => {
		user.customer = 'ok';
		const j = require('request').jar();
		const request = require('request').defaults({jar: j});
		async.series([
			(cb) => {
				request({
					url: `http://localhost:${port}${login_path}`,
					method: 'POST',
					form: {
						customer: 'user',
						email: 'email',
						password: 'password'
					}
				}, (err, res, body) => {
					expect(res.statusCode).equal(200);
					//expect(res.headers.location).equal(login_path);
					return cb(err);
				});
			},
			(cb) => {
				request({
					url: `http://localhost:${port}${secure_path}`,
					method: 'GET',
					followRedirect: false,
					headers: {
						Cookie: j.getCookieString(`http://localhost:${port}`)
					}
				}, (err, res, body) => {
					expect(res.statusCode).equal(200);
					return cb(err);
				});
			}
		], (err, res) => {
			if (err) return done(err);
			done();
		});
	});
	
	it('Logout Routine', (done) => {
		user.customer = 'ok';
		const j = require('request').jar();
		const request = require('request').defaults({jar: j});
		async.series([
			(cb) => {
				request({
					url: `http://localhost:${port}${login_path}`,
					method: 'POST',
					form: {
						customer: 'user',
						email: 'email',
						password: 'password'
					}
				}, (err, res, body) => {
					expect(res.statusCode).equal(200);
					//expect(res.headers.location).equal(login_path);
					return cb(err);
				});
			},
			(cb) => {
				request({
					url: `http://localhost:${port}${secure_path}`,
					method: 'GET',
					followRedirect: false,
					headers: {
						Cookie: j.getCookieString(`http://localhost:${port}`)
					}
				}, (err, res, body) => {
					expect(res.statusCode).equal(200);
					return cb(err);
				});
			},
			(cb) => {
				request({
					url: `http://localhost:${port}${logout_path}`,
					method: 'GET',
					followRedirect: false,
					headers: {
						Cookie: j.getCookieString(`http://localhost:${port}`)
					}
				}, (err, res, body) => {
					expect(res.statusCode).equal(200);
					return cb(err);
				});
			},
			(cb) => {
				request({
					url: `http://localhost:${port}${secure_path}`,
					method: 'GET',
					followRedirect: false,
					headers: {
						Cookie: j.getCookieString(`http://localhost:${port}`)
					}
				}, (err, res, body) => {
					expect(res.statusCode).equal(302);
					expect(res.headers.location).equal('/loginURL');
					return cb(err);
				});
			}
		], (err, res) => {
			if (err) return done(err);
			done();
		});
	});
});