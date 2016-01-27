function State(key) {
    this.key = key || 'chartState-v1';
}

State.prototype.merge = function (state) {
    var savedState = JSON.parse(localStorage.getItem(this.key) || '{}');
    var savedCharts = _.groupBy(savedState.charts || [], 'id');
    savedCharts = _.mapValues(savedCharts, _.property(0));

    state.charts = state.charts.map(function (chart) {
        return _.extend(savedCharts[chart.id] || {}, chart);
    });

    state.showActiveSession = true;
    return state;
};

State.unserializableChartKeys = ['c3MiniChart', 'c3fullChart', 'preprocess'];

State.prototype.save = function (state) {
    savedState = _.clone(state);
    savedState.charts = savedState.charts.map(function (chart) {
        return _.omit(chart, State.unserializableChartKeys);
    });

    localStorage.setItem(this.key, JSON.stringify(savedState));
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

function DataFetcher() {
    this.cache = {};
}

DataFetcher.prototype.fetchJson = function (url) {
    if (this.cache[url]) {
        return this.cache[url];
    }

    return this.cache[url] = new Promise(function (resolve) {
        d3.json(url).get(function (error, data) {
            resolve(data);
        });
    });
};

function miniChart(node, config) {
    return c3.generate({
        bindto: node,
        size: {
            width: 100,
            height: 40
        },

        transition: {
            duration: 0
        },

        interaction: {
            enabled: false
        },
        data: {
            columns: [],
            type: config.data.type || line
        },
        axis: {
            x: {
                show: false
            },
            y: {
                show: false
            }
        },
        legend: {
            show: false
        },
        point: {
            r: 0.1
        },
        pie: {
            label: {
                show: false
            }
        }
    });
}

function fullChart(node, config) {
    var chartConfig = {
        bindto: node,
        size: {
            width: 600,
            height: 450
        },
        padding: {
            right: 20
        },
        transition: {
            duration: 0
        },
        data: {
            columns: []
        },
        point: {
            r: 2,
            focus: {
                expand: {
                    r: 4
                }
            }
        }
    };

    return c3.generate(_.merge(chartConfig, config));
}

function Charts(node) {
    this.state = {
        charts: [],
        data: {}
    };

    this.dataFetcher = new DataFetcher();
    this.stateManager = new State();
    this.prepareLayout(node);
}

Charts.prototype.add = function (chart) {
    if (chart.disabled) {
        return;
    }
    this.state.charts.push(chart);
};

Charts.prototype.prefixSingleItem = function (item, prefix) {
    return prefix + "_" + item;
};

Charts.prototype.prefixData = function (columns, prefix) {
    //return columns;

    return columns.map((column) => {
        var result = _.clone(column);
        result[0] = this.prefixSingleItem(result[0], prefix);
        return result;
    })
};


Charts.prototype.unloadChartData = function (prefix) {

    this.state.charts.map(function (chart) {

        var ids = _.pluck(chart.c3MiniChart.data(), 'id').filter((id)=> {
            return !id.indexOf(prefix + '_')
        });
        chart.c3MiniChart.unload({ids: ids});
        chart.c3fullChart.unload({ids: ids});
    });
};

Charts.prototype.loadChartData = function (chartData) {
    chartData = _.indexBy(chartData, 'id');
    this.state.charts.forEach(function (chart) {
        var data = {columns: chartData[chart.id] ? chartData[chart.id].data: []};
        chart.c3MiniChart.load(data);
        chart.c3fullChart.load(data);
    });
};

Charts.prototype.fetchRunData = function (runConfig) {
    var prefix = runConfig.id;

    return this.dataFetcher.fetchJson('api/' + runConfig.type+'/' + runConfig.id + '.json')
        .then(function(data){
            return _.map(data, function(data, chartId)  {
                return {
                    id: chartId,
                    data: this.prefixData(data, prefix)
                };
            }.bind(this));
        }.bind(this))
        .then(this.loadChartData.bind(this))
        .then(this.handleStageChange.bind(this));
};
Charts.prototype.start = function (node) {
    this.state = this.stateManager.merge(this.state);

    this.dataFetcher.fetchJson('api/runs.json').then(function (runs) {
        this.state.runs = runs;
        if (runs.length > 0) {
            this.display(node);
        } else {
            this.bigCharts.append('h1').html('no charts found, please run the model');
        }
    }.bind(this));
};

Charts.prototype.prepareLayout = function (node) {
    var root = d3.select(node).append('div');
    this.list = root.append('ul').classed('mini-charts panel', true);
    this.bigCharts = root.append('div').classed('full-charts panel', true);
    this.saves = root.append('div').classed('saves panel', true);
    this.stats = this.bigCharts.append('div').classed('stats', true);
};

Charts.prototype.handleStageChange = function () {
    this.stateManager.save(this.state);
    this.display();
};

Charts.prototype.display = function () {


    var stats = this.stats
        .selectAll('.stat-item')
        .data(_(this.state.runs).filter('loaded').filter('stats').value());


    statsEnter = stats.enter().append('div').classed('stat-item', true);

    stats.exit().remove();
    stats.html(function (item) {
        var result = '<h3>' + (item.label || '*') + '</h3>';
        result += '<div class = "stats-wrap">';
        var stats = _.pick(item.stats, ['cached', 'seed', 'CRICoef', 'duration', 'run', 'diff']);
        for (var stat in stats) {
            if (stats.hasOwnProperty(stat)) {
                result += '<div class = "single-stat"><span class = "key">' + stat + ':</span><span class = "value">' + stats[stat] + '</span></div>';
            }
        }
        result += '</div>';
        return result;
    });

    var fullCharts = this.bigCharts.selectAll('div.chart-wrapper');

    var fullChartsEnter = fullCharts.data(this.state.charts).enter();

    var chartWrap = fullChartsEnter.append('div').classed('chart-wrapper', true);


    chartWrap.append('h2').html(_.property('label'));

    chartWrap.append(function (chart) {
        var element = document.createElement("div");
        element.className = 'full-chart';
        chart.c3fullChart = fullChart(element, chart.c3Config);
        return element;
    });

    this.bigCharts.selectAll('div.chart-wrapper').classed('disabled', _.property('disabled'));


    var lis = this.list.selectAll('li')
        .data(this.state.charts);

    var lisEnter = lis.enter()
        .append('li')
        .classed('chart-item', true)
        .on('click', function (chart) {
            chart.disabled = false;
            this.handleStageChange();
            chart.c3fullChart.element.parentElement.scrollIntoView();
        }.bind(this));

    lis.classed('disabled', _.property('disabled'));

    lisEnter.append('div').classed('chart-item-label', true);

    lis.select('.chart-item-label')
        .html(_.property('label'));


    lisEnter.append(function (chart) {
        var element = document.createElement("div");
        element.className = 'mini-chart';
        chart.c3MiniChart = miniChart(element, chart.c3Config);
        return element;
    }.bind(this));

    lisEnter.append('div')
        .classed('hider', true)
        .html('&times;')
        .on('click', function (chart) {
            chart.disabled = !chart.disabled;
            this.handleStageChange();
            d3.event.stopPropagation();
        }.bind(this));


    var loads = this.saves.selectAll('.load-button')
        .data(this.state.runs || []);

    loads.enter()
        .append('div')
        .classed('load-button save-load-button', true)
        .classed('session', _.matchesProperty('type', 'session'))
        .on('click', (save) => {
            save.loaded = !save.loaded;

            if (save.loaded) {
                this.fetchRunData(save);
            } else {
                this.unloadChartData(save.id)
            }
            this.handleStageChange();
        });


    loads.html(_.property('label'))
        .classed('loaded', _.property('loaded'))
        .style('box-shadow', function (item) {
            return '5px 0px 0px ' + item.color;
        });
};
