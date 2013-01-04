console.log('welcome to config');
var fs = require('fs');
var path = require('path');
var _ = require('underscore')._;
var url = require('url');

var config = JSON.parse(fs.readFileSync(path.resolve(__dirname, './config.defaults.json'), 'utf-8').replace('\n', '').replace(/\/\*[\s\S]*?\*\//g,""));
/*
try {
  var json = JSON.parse(fs.readFileSync(path.resolve(__dirname, './config.json'), 'utf-8').replace('\n', '').replace(/\/\*[\s\S]*?\*\//g,""));
} catch (e) {
  var json = {};
}

_.each(config,function(value,key) {
  if (typeof json[key] != 'undefined') config[key] = json[key];
});*/

// heroku passes the PORT and MONGOHQ_URL env variables
console.log('env', process.env);
if (typeof process.env['PORT'] != 'undefined') config['NODE_PORT'] = process.env['PORT'];
if (typeof process.env['MONGOHQ_URL'] != 'undefined') config['MONGODB'] = process.env['MONGOHQ_URL'];

/* if we have a router (like on heroku) or nginx between the client and node, the port on which we access
 the app might be different than the port on which node listen's (ex: on heroku, the client is on port 80),
 but node listens on a random port above 40000. If nothing is present in the config, we assume the client
 accesses node directly */
config.HOSTPORT = config.HOST+((parseInt(config.HOST_PORT,10)!=80)?":"+config.HOST_PORT:"");


// export non sensible data (used in tests)
var exportedConfig = [];
_.each(["HOSTPORT"], function(k) {
  if (k in config) {
    exportedConfig[k] = config[k];
  }
});
exports.config = exportedConfig;



exports.getConfig = function(cb) {
 return cb(null, config);
};
