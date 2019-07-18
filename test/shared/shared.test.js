const async = require('async');
const {expect} = require('chai');

module.exports = function(testConfig) {
	
	it('Needs to initialize', (done) => {
		done();
	});
	
	it('Login Success', (done) => {
		testConfig.cred_valid = true;
		//user.customer = 'ok';
		async.series([
			(cb) => {
				require('request')({
					url: `http://localhost:${testConfig.port}${testConfig.login_path}`,
					method: 'POST',
					form: {
						customer: 'user',
						email: 'email',
						password: 'password'
					}
				}, (err, res, body) => {
					expect(res.statusCode).equal(200);
					//expect(res.headers.location).equal(testConfig.login_path);
					return cb(err);
				});
			}
		], (err, res) => {
			if (err) return done(err);
			done();
		});
	});
	
	
	it('Login Failed', (done) => {
		testConfig.cred_valid = false;
		//user.customer = 'fail';
		async.series([
			(cb) => {
				require('request')({
					url: `http://localhost:${testConfig.port}${testConfig.login_path}`,
					method: 'POST',
					form: {
						customer: 'fail',
						email: 'email',
						password: 'password'
					}
				}, (err, res, body) => {
					expect(res.statusCode).equal(302);
					expect(res.headers.location).equal(testConfig.failed_path);
					return cb(err);
				});
			}
		], (err, res) => {
			if (err) return done(err);
			done();
		});
	});
	
	it('No Login', (done) => {
		testConfig.cred_valid = true;
		//user.customer = 'ok';
		async.series([
			(cb) => {
				require('request')({
					url: `http://localhost:${testConfig.port}${testConfig.secure_path}`,
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
		testConfig.cred_valid = true;
		//user.customer = 'ok';
		const j = require('request').jar();
		const request = require('request').defaults({jar: j});
		async.series([
			(cb) => {
				request({
					url: `http://localhost:${testConfig.port}${testConfig.login_path}`,
					method: 'POST',
					form: {
						customer: 'user',
						email: 'email',
						password: 'password'
					}
				}, (err, res, body) => {
					expect(res.statusCode).equal(200);
					//expect(res.headers.location).equal(testConfig.login_path);
					return cb(err);
				});
			},
			(cb) => {
				request({
					url: `http://localhost:${testConfig.port}${testConfig.secure_path}`,
					method: 'GET',
					followRedirect: false,
					headers: {
						Cookie: j.getCookieString(`http://localhost:${testConfig.port}`)
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
		testConfig.cred_valid = true;
		//user.customer = 'ok';
		const j = require('request').jar();
		const request = require('request').defaults({jar: j});
		async.series([
			(cb) => {
				request({
					url: `http://localhost:${testConfig.port}${testConfig.login_path}`,
					method: 'POST',
					form: {
						customer: 'user',
						email: 'email',
						password: 'password'
					}
				}, (err, res, body) => {
					expect(res.statusCode).equal(200);
					//expect(res.headers.location).equal(testConfig.login_path);
					return cb(err);
				});
			},
			(cb) => {
				request({
					url: `http://localhost:${testConfig.port}${testConfig.secure_path}`,
					method: 'GET',
					followRedirect: false,
					headers: {
						Cookie: j.getCookieString(`http://localhost:${testConfig.port}`)
					}
				}, (err, res, body) => {
					expect(res.statusCode).equal(200);
					return cb(err);
				});
			},
			(cb) => {
				request({
					url: `http://localhost:${testConfig.port}${testConfig.logout_path}`,
					method: 'GET',
					followRedirect: false,
					headers: {
						Cookie: j.getCookieString(`http://localhost:${testConfig.port}`)
					}
				}, (err, res, body) => {
					expect(res.statusCode).equal(200);
					return cb(err);
				});
			},
			(cb) => {
				request({
					url: `http://localhost:${testConfig.port}${testConfig.secure_path}`,
					method: 'GET',
					followRedirect: false,
					headers: {
						Cookie: j.getCookieString(`http://localhost:${testConfig.port}`)
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
};