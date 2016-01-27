var fs = require('fs'),
    path = require('path'),
    _ = require('lodash');

module.exports.dataPath = 'data';
module.exports.runsBySession = () => {
    return _(fs.readdirSync(module.exports.dataPath)).map(function (id) {
        return {
            session: id.split('_')[0],
            label: id.split('_')[1],
            id: id,
            time: fs.statSync(path.join(module.exports.dataPath, id)).ctime.getTime(),
            type: 'run'
        };
    }).sortBy('time').reverse().groupBy('session').value();
};