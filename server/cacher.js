var fs = require('fs'),
    path = require('path');


module.exports = function cacherMiddleware(config) {
    return (req, res, next) => {
        if(req.url.indexOf('.json') > -1){
            var tempEnd = res.end;
            res.end = (value) => {
                fs.writeFileSync(path.join(config.path, decodeURI(req.url)), value);
                return tempEnd.call(res, value)
            };
        }
        next();
    }

};