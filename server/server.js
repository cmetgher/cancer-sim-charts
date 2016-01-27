var express = require('express'),
    serveStatic = require('serve-static'),
    fs = require('fs'),
    chartFetcher = require('../chartsConfig');

express()
    .use(require('./cacher')({
        path: './',
        enabled: true
    }))
    .get('/api/runs.json', require('./runs'))
    .get('/api/run/:run.json', require('./run')(chartFetcher))
    .get('/api/session/:session.json', require('./session')(chartFetcher))
    .use(serveStatic('.'))
    .listen(7777);

console.log('Listening on port 7777.');