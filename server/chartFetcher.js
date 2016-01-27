var path = require('path'),
    fs = require('fs'),
    d3 = require('d3'),
    _ = require('lodash'),
    utils = require('./utils');


var ChartFetcher = function () {
    this.charts = [];
};

ChartFetcher.prototype.add = function (chart) {
    this.charts.push(chart);
};

ChartFetcher.prototype.start = function () {
};


function prepareStats(stats) {
    stats = _.reduce(stats, function (result, item) {
        result[item.key] = item.value;
        return result;
    }, {});

    var c = 100 * 1000 / stats.total;
    stats.adjustNumberPer100K = function (number) {
        return c * number;
    };

    var adjusts = {
        per100k: function (columns) {
            return columns.map(function (column) {
                for (i = 1; i < column.length; i++) {
                    column[i] = column[i] * c;
                }
                return column;
            });
        }
    };
    stats.adjust = function (data, type) {
        if (!adjusts[type]) {
            return data;
        }
        return adjusts[type](data);
    };


    return stats;
}

ChartFetcher.prototype.fetchAvgSession = function (session) {
    var sessions = utils.runsBySession()[session].map((session)=> {
        return this.fetchAllCharts(session.id)
    });


    sessions = _(this.charts).indexBy('id').mapValues((chart) => {
        return _(sessions).pluck(chart.id).flatten().groupBy(0)
            .map((data, key)=> {

                var avgValues = _(data).unzip().tail().map(_.sum).map(sum => {
                    return sum / data.length;
                }).value();
                return [key].concat(avgValues);
            }).value();

    }).value();

    return sessions;
};
ChartFetcher.prototype.fetchData = function (run, source) {

    var file = path.join('data', run, source);
    if (!fs.existsSync(file)) {
        //console.log('no such file: '+ file);
        return [];
    }


    return d3.csv.parse(fs.readFileSync(file, 'UTF-8'));
};

ChartFetcher.prototype.fetchAllCharts = function (run) {
    var stats = prepareStats(this.fetchData(run, 'stats.csv'));

    return this.charts.filter(function (chart) {
        return chart.disabled !== true;
    }).reduce((result, chart) => {
        var data = this.fetchData(run, chart.source);
        data = chart.preprocess.call(chart, data, stats, this);
        result[chart.id] = data;
        return result;
    }, {});
};

module.exports = ChartFetcher;