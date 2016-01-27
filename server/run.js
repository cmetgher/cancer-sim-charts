var fs = require('fs');

module.exports = (chartFetcher) => {
    return function runMiddleware(req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(chartFetcher.fetchAllCharts(req.params.run)));
    };
};

