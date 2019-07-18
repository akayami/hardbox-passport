const async = require('async');
const {expect} = require('chai');

module.exports = function(testConfig) {
	it('Unauthorized access allowed to "secure" path', (done) => {
		testConfig.cred_valid = true;
		
		async.series([
			(cb) => {
				require('request')({
					url: `http://localhost:${testConfig.port}${testConfig.secure_path}`,
					method: 'GET',
					followRedirect: false
				}, (err, res, body) => {
					expect(res.statusCode).equal(200);
					//expect(res.headers.location).equal(secure_path);
					return cb(err);
				});
			}
		], (err, res) => {
			if (err) return done(err);
			done();
		});
	});
};