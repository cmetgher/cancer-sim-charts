var request = require('request');

require('./server/server');
var base = 'http://localhost:7777';

// Server can only handle one request at a time.
function fetch(list) {
    if(list.length == 0){
        console.log('done');
        return;
    }
    var runConfig = list.pop();

    if(runConfig.id == '.DS_Store' || runConfig.id == '.DS'){
        return fetch(list);
    }

    var url = '/api/' + runConfig.type + '/' + runConfig.id + '.json';

    request(base + url, function (error, response) {
        console.log(response.statusCode + " :: " + url);
        fetch(list);
    });
}


request(base + '/api/runs.json', function (error, response) {
    fetch(JSON.parse(response.body));
});
