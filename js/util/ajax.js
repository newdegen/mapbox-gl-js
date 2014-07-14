'use strict';

var request = require('request');

exports.getJSON = function(url, callback) {
    request(url, function(error, response, body) {
        if (!error && response.statusCode >= 200 && response.statusCode < 300) {
            var data;
            try { data = JSON.parse(body); }
            catch (err) { return callback(err); }
            callback(null, data);
        } else {
            callback(error || new Error(response.statusCode));
        }
    });
};

exports.getArrayBuffer = function(url, callback) {
    request({url: url, encoding: null}, function(error, response, body) {
        if (!error && response.statusCode >= 200 && response.statusCode < 300) {
            var ab = new ArrayBuffer(body.length);
            var view = new Uint8Array(ab);
            for (var i = 0; i < body.length; ++i) {
                view[i] = body[i];
            }
            callback(null, ab);
        } else {
            callback(error || new Error(response.statusCode));
        }
    });
};
