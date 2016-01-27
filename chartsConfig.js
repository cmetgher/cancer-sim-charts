if(typeof _ === "undefined"){
    var _ = require('lodash');
}
if(typeof Charts === "undefined"){
    var Charts = require('./server/chartFetcher');
}

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

function countAndFlatten(data, column) {
    return _(data).countBy(column).map((value, key)=>{
        return [key, value];
    }).value();
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

charts.add({
    id: 'delaysByInsurance',
    label: 'Delays by insurance',
    source: 'delays-aggregated.csv',
    preprocess: function (data) {
        return [
            ['COVERED_BY_HEALTH_INSURANCE'].concat(_.pluck(_.where(data, {Value: 'COVERED_BY_HEALTH_INSURANCE'}), 'Days')),
            ['NOT_COVERED_BY_HEALTH_INSURANCE'].concat(_.pluck(_.where(data, {Value: 'NOT_COVERED_BY_HEALTH_INSURANCE'}), 'Days'))
        ];
    },
    c3Config: {
        data: {
            type: 'bar',
            groups: [
                ['COVERED_BY_HEALTH_INSURANCE', 'NOT_COVERED_BY_HEALTH_INSURANCE']
            ]
        },
        axis: {
            x: {
                tick: {
                    format: function (x) {
                        return ['Notice symptoms', 'Infer illness', 'Decide to see PCP', 'Receive medical attention', 'Begin Treatment'][x];
                    }
                },
                label: {
                    text: 'Delay type',
                    position: 'outer-center'

                }
            },
            y: {
                label: {
                    text: 'Days',
                    position: 'outer-center'
                }
            }
        }
    }
});


charts.add({
    id: 'delaysByRace',
    label: 'Delays by race',
    source: 'delays-aggregated.csv',
    preprocess: function (data) {
        return [
            ['AFRICAN_AMERICAN'].concat(_.pluck(_.where(data, {Value: 'AFRICAN_AMERICAN'}), 'Days')),
            ['WHITE'].concat(_.pluck(_.where(data, {Value: 'WHITE'}), 'Days'))
        ];
    },
    c3Config: {
        data: {
            type: 'bar',
            groups: [
                ['AFRICAN_AMERICAN', 'WHITE']
            ]
        },
        axis: {
            x: {
                tick: {
                    format: function (x) {
                        return ['Notice symptoms', 'Infer illness', 'Decide to see PCP', 'Receive medical attention', 'Begin Treatment'][x];

                    }
                },
                label: {
                    text: '',
                    position: 'outer-center'

                }
            },
            y: {
                label: {
                    text: 'Delay type',
                    position: 'outer-center'
                }
            }
        }
    }
});

charts.add({
    id: 'incidenceByStage',
    group: 'incidence by stage',
    label: 'Incidence by stage',
    source: 'incidence.csv',
    preprocess: function (data) {
        var byStage = _.groupBy(data, 'Stage');
        return _.map(byStage, function (items, stage) {
            byYear = _.values(_.countBy(items, 'Year'));
            return [stage].concat(byYear);
        });
    },
    c3Config: {
        data: {
            type: 'bar'
        },
        axis: predefinedConfigs.yearAndPeopleAxis
    }
});

charts.add({
    id: 'incidenceByYear',
    label: 'Incidence by year',
    source: 'incidence.csv',
    preprocess: function (data) {
        return [flattenByYear(data, 'incidence')];
    },
    c3Config: {
        data: {
            type: 'area'
        },
        legend: {
//            show: false
        },
        axis: predefinedConfigs.yearAndPeopleAxis
    }
});


charts.add({
    id: 'incidenceByRace',
    label: 'Incidence by race',
    source: 'incidence.csv',
    preprocess: function (data) {
        data = _.pick(_.groupBy(data, 'Race'), ['WHITE', 'AFRICAN_AMERICAN']);
        return _.map(data, function (item, key) {
            return [key].concat(_.values(_.countBy(item, 'Year')));
        });
    },
    c3Config: {
        data: {
            type: 'area'
        },
        axis: predefinedConfigs.yearAndPeopleAxis
    }
});

charts.add({
    id: 'incidenceByGender',
    label: 'Incidence by gender',
    source: 'incidence.csv',
    preprocess: function (data) {
        data = _.groupBy(data, 'Gender');
        return _.map(data, function (item, key) {
            return [key].concat(_.values(_.countBy(item, 'Year')));
        });
    },
    c3Config: {
        data: {
            type: 'area'
        },
        axis: predefinedConfigs.yearAndPeopleAxis
    }
});

charts.add({
    id: 'incidenceByAge',
    group: 'incidence by age',
    label: 'Incidence by age',
    source: 'incidence.csv',
    preprocess: function (data, stats) {
        byGender = _.groupBy(data, 'Gender');
        return _.map(byGender, function (items, gender) {
            items = _.countBy(items, function (item) {
                return ageGroupMap[Math.floor(item.Age / 5)]
            });

            byAgeGroup = _.map(ageGroupMap, function (ageGroup) {
                return stats[ageGroup] == 0 ? 0 : (items[ageGroup] || 0) / (stats[ageGroup]) * 100;
            });

            return [gender].concat(byAgeGroup);
        });
    },
    c3Config: {
        data: {
            type: 'area'
        },
        axis: {
            x: {
                min: 6,
                tick: {
                    format: formats.ageGroup
                },
                label: {
                    text: 'Age group',
                    position: 'outer-center'
                }
            },
            y: {
                label: {
                    text: 'Rate by age group',
                    position: 'outer-center'
                }
            }
        }
    }
});


charts.add({
    id: 'polypRemoval',
    group: 'Polyp removal',
    label: 'Polyp removal',
    source: 'polyp-removal.csv',
    preprocess: function (data) {
        return [['Polyps'].concat(_(data).countBy('Year').values().value())]
    },
    c3Config: {
        data: {
            type: 'area'
        },
        axis: predefinedConfigs.yearAndPeopleAxis
    }
});



charts.add({
    id: 'mortality',
    group: 'mortality',
    label: 'Mortality',
    source: 'mortality.csv',
    preprocess: function (rows) {
        data = _.groupBy(rows, 'Gender');
        //   data = _.map(data, flattenByYear);
        return [flattenByYear(rows, "Total")];
    },
    c3Config: {
        data: {
            type: 'area'
        },
        legend: {
      //      show: false
        },
        axis: predefinedConfigs.yearAndPeopleAxis
    }
});

charts.add({
    id: 'mortalityByGender',
    label: 'Mortality by gender',
    source: 'mortality.csv',
    preprocess: function (data) {
        data = _.groupBy(data, 'Gender');
        return _.map(data, function (item, key) {
            return [key].concat(_.values(_.countBy(item, 'Year')));
        });
    },
    c3Config: {
        data: {
            type: 'area'
        },
        legend: {
            //show: false
        },
        axis: predefinedConfigs.yearAndPeopleAxis
    }
});

charts.add({
    disabled: false,
    id: 'mortalityByReason',
    label: 'Mortality by Reason',
    source: 'mortality.csv',
    preprocess: function (data) {
        data = _.groupBy(data, 'Reason');
        return _.map(data, function (item, key) {
            return [key].concat(_.values(_.countBy(item, 'Year')));
        });
    },
    c3Config: {
        data: {
            type: 'area'
        },
        axis: predefinedConfigs.yearAndPeopleAxis
    }
});

charts.add({
    id: 'mortalityByRace',
    label: 'Mortality by race',
    source: 'mortality.csv',
    preprocess: function (data) {
        data = _.pick(_.groupBy(data, 'Race'), ['AFRICAN_AMERICAN', 'WHITE', 'ASIAN', 'AMERICAN_INDIAN']);

        return _.map(data, function (item, key) {
            return [key].concat(_.values(_.countBy(item, 'Year')));
        });
    },
    c3Config: {
        data: {
            type: 'area'
        },
        axis: predefinedConfigs.yearAndPeopleAxis
    }
});


charts.add({
    disabled: true,
    id: 'smoking',
    group: 'smoking',
    label: 'Smoking',
    source: 'smoking.csv',
    preprocess: function (rows) {
        return ['Does not smoke', 'Smokes'].map(function (item) {
            return [item].concat(_.pluck(rows, item));
        });
    },
    c3Config: {
        data: {
            type: 'area'
        }
    }
});

charts.add({
    disabled: true,
    id: 'cancerIndex',
    group: 'cancerIndex',
    label: 'cancerIndex',
    source: 'cancerIndex.csv',
    preprocess: function (data) {
        return [flattenBy(data, 'CancerIndex')];
    },
    c3Config: {
        data: {
            type: 'area'
        }
    }
});


charts.add({
    disabled: false,
    id: 'survivorByYear',
    label: 'Survivors by year',
    source: 'survivors.csv',
    preprocess: function (data) {
        return [flattenByYear(data, 'survivors')];
    },
    c3Config: {
        data: {
            type: 'area'
        },
        axis: predefinedConfigs.yearAndPeopleAxis
    }
});

charts.add({
    disabled: true,
    id: 'stagesAtGeneration',
    label: 'Stages at generation',
    source: 'stats.csv',
    adjust: false,
    preprocess: function (data) {
        data = _.indexBy(data, 'key');
        return [
            ['polyp5', data.polyp.value],
            ['stage1', data.stage1.value],
            ['stage2', data.stage2.value],
            ['stage3', data.stage3.value],
            ['stage4', data.stage3.value]
        ];
    },
    c3Config: {
        data: {
            type: 'bar'
        },
        point: {
            r: 0
        }
    }
});

charts.add({
    disabled: false,
    id: '_screeningByRace',
    label: 'Screening By Race',
    source: 'screening.csv',
    preprocess: function (data) {
        return countAndFlatten(data, 'Race');
    },
    c3Config: {
        data: {
            type: 'bar'
        }
    }
});

charts.add({
    disabled: false,
    id: '_screeningByHealthInsurance',
    label: 'Screening By HI',
    source: 'screening.csv',
    preprocess: function (data) {
        return countAndFlatten(data, 'HealthInsurance');
    },
    c3Config: {
        data: {
            type: 'bar'
        }
    }
});



charts.add({
    disabled: true,
    id: 'stages',
    group: 'stages',
    label: 'Stages over time',
    source: 'byStage.csv',
    preprocess: function (data) {
        return _.map(['POLYP', 'STAGE_1', 'STAGE_2', 'STAGE_3', 'STAGE_4'], flattenBy.bind(null, data));
    },
    adjust: 'per100k',
    c3Config: {
        data: {
            type: 'area'
        },
        point: {
            r: 0
        }
    }
});


charts.add({
    id: 'survivorByStage',
    group: 'Survivors',
    label: 'Survivors by stage',
    source: 'survivors.csv',
    preprocess: function (data) {
        return flattenByStage(data, 'survivors');
    },
    c3Config: {
        axis: {
            x: {
                tick: {
                    format: _.constant('')
                },
                label: {
                    text: '',
                    position: 'outer-center'

                }
            },
            y: {
                label: {
                    text: 'Rate per 100,000',
                    position: 'outer-center'
                }
            }
        },
        data: {
            type: 'bar'
        }
    }
});

charts.add({
    id: 'survivorByStageAndRace',
    label: 'Survivors by race',
    source: 'survivors.csv',
    preprocess: function (data) {
        return _.map(_.pick(_.groupBy(data, 'Race'), ['WHITE', 'AFRICAN_AMERICAN']), (value, key) => {
            return [key].concat(_.values(_.countBy(value, 'Stage')));
        });
    },
    c3Config: {
        data: {
            type: 'bar'
        },
        axis: {
            x: {
                tick: {
                    format: function (x) {
                        return ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4'][x];
                    }
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
    }
});



charts.add({
    id: 'stageUpdate',
    disabled: true,
    label: 'stageUpdate',
    source: 'stageUpdate.csv',
    preprocess: function (data) {
        debugger;
        return [flattenByYear(data, 'treatment')];
    },
    c3Config: {
        data: {
            type: 'bar'
        },
        axis: {
            x: {
                tick: {
                    format: formats.indexToYear
                }
            }
        }
    }
});


charts.add({
    id: 'treatmentByYear',
    disabled: true,
    label: 'Treatment by year',
    source: 'treatment.csv',
    preprocess: function (data) {
        return [flattenByYear(data, 'treatment')];
    },
    c3Config: {
        data: {
            type: 'bar'
        },
        axis: {
            x: {
                tick: {
                    format: formats.indexToYear
                }
            }
        }
    }
});


charts.start();
if(typeof module !== "undefined"){
    module.exports = charts;
}