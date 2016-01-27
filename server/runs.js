var fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    ColorHash = require('color-hash'),
    utils = require('./utils');
var colorHash = new ColorHash();

module.exports = function runMiddleware(req, res) {
    res.setHeader('Content-Type', 'application/json');
    var data = _(utils.runsBySession())
        .map((values, key)=> {
            return [{
                id: key,
                type: 'session',
                label: key,
                session: key
            }].concat(values);
        })
        .flatten()
        .map((item) => {
            return _.extend({
                color: colorHash.hex(item.session.substr(0, item.session.lastIndexOf('-')).split('').reverse().join())
            }, item);

        }).value();

    res.end(JSON.stringify(data));
};