var fs = require('fs'),
    utils = require('./utils');



module.exports = function (chartFetcher) {
    return function runMiddleware(req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(chartFetcher.fetchAvgSession(req.params.session)));
    };
};
