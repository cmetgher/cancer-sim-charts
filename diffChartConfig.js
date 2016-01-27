function flattenByYear(data, key) {
    var byYear = _.countBy(data, 'Year');
    return [key].concat(_.range(2000, 2005).map(function (val) {
        return byYear[val] || 0;
    }));
}

function flattenByStage(data) {
    var byStage = _.countBy(data, 'Stage');
    return ['STAGE_1', 'STAGE_2', 'STAGE_3', 'STAGE_4'].map(function (key) {
        return [key].concat(byStage[key] || 0);
    });
}

function flattenBy(data, key) {
    return [key].concat(_.pluck(data, key));
}

var ageGroupMap = _.range(0, 18).reduce(function (result, i) {
    result[i] = (5 * i) + '-' + (5 * i + 4);
    return result;
}, {});

var charts = new Charts('#charts');

var formats = {
    indexToYear: function (index) {
        return (2000 + index);
    },
    ageGroup: function (index) {
        return ageGroupMap[index];
    }
};


var predefinedConfigs = {
    yearAndPeopleAxis: {
        x: {
            tick: {
                format: formats.indexToYear
            },
            label: {
                text: 'Year',
                position: 'outer-center'

            }
        },
        y: {
            label: {
                text: 'Rate per 100,000',
                position: 'outer-center'
            }
        }
    }

};
function calcDiff(data1, data2){
    return  _.unique(_.keys(data1).concat(_.keys(data2)))
        .map(function (id) {
            if (data1[id] && data2[id] && data1[id].Stage == data2[id].Stage) {

                return {
                    diff: 0,
                    id: id,
                    stage: 'Same'
                };
            }

            var data1Stage = data1[id] && data1[id].Stage || 'NO_STAGE';
            var data2Stage = data2[id] && data2[id].Stage || 'NO_STAGE';
            if(isNaN(stageWeight[data1Stage] - stageWeight[data2Stage])){
                debugger;
            }
            return {
                diff: stageWeight[data1Stage] - stageWeight[data2Stage],
                id: id,
                stage: data1Stage + '-' + (data2Stage)
            };
        });
}

var stageWeight = {
    NO_STAGE: 0,
    STAGE_1: 1,
    STAGE_2: 2,
    STAGE_3: 3,
    STAGE_4: 4

};
charts.add({
    id: 'delaysByInsurance',
    label: 'Incidence diff',
    source: 'incidence.csv',
    preprocess: function (data, stats, charts) {
        if (_.size(charts.state.data) == 2) {
            var peopleById =  _.map(charts.state.data, function (data) {
                return _.indexBy(data[this.source], 'Id');
            }.bind(this));
            var people = _.reduce(peopleById, calcDiff);
            debugger;
            debugger;
        }
        return [];
    },
    c3Config: {
        data: {
            type: 'bar'
        }
    }
});


charts.start();
