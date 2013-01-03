process.chdir(__dirname);


var express = require('express'),
    http=require('http'),
    _ = require('underscore')._,
    fs = require('fs'),
    path = require("path"),
    request = require('request'),
    ObjectId = require('mongoose').Types.ObjectId;



require('./config').getConfig(function(err, config) {
  if (err) { console.log("ERROR", err); process.exit(1); }
  global.platform_config = config;

  
  /**
    * init database
  **/

  require('./db').getDb(function(err,db){
    
    db.mongoose.connect(config.MONGODB);

    // Create HTTP server
    var app = express();
    var server = http.createServer(app);

    // Connect to mongodb
  //  models.connect();

  // Configuration
    app.configure(function() {
      app.use(express.bodyParser());
      app.use(express.cookieParser());
      app.use(express.methodOverride());
      app.use(express.static('public'));
    });

    

    app.get('/calendar', function(req, res){
      if (!req.query || !req.query.callback){
        req.query.callback = 'callback';
      }
      
      db.Fixture.find({}, function(err, fixtures){
        if (err){
          return res.status(500).jsonp('An error occured : '+err);
        }
        if (!fixtures || !fixtures.length){
          return res.status(404).jsonp('Error : No results');
        }
        res.jsonp(fixtures);
      });

      
    });

    
    /*Admin */
    app.get('/admin/fixtures/new', function(req, res){

      res.sendfile('admin/new-fixture.html');

    });

    app.post('/fixtures/new', function(req, res){

      var fixture = db.Fixture({team1:req.param('team1'), team2:req.param('team2'), date:req.param('date')});
      fixture.save(function(err){
        if (err){
          return res.status(500).send(err);
        }
        return res.json(fixture);
      });

    });

    app.get('/', function(req, res){
      return fourofour(req,res);
    });

    var fourofour = function(req, res){
          res.status(404);

      // respond with html page
      if (req.accepts('html')) {
        res.status(404).sendfile('errors/404.html');
        return;
      }

      // respond with json
      if (req.accepts('json')) {
        res.send({ error: 'Not found' });
        return;
      }

      // default to plain-text. send()
      res.type('txt').send('Not found');
    };

    app.use(function(req, res, next){
      return fourofour(req, res);
    });

    app.configure('development', function(){
      app.use(express.static(path.resolve(__dirname,'../public')));
    });



  
    server.listen(parseInt(global.platform_config.NODE_PORT,10),function() {

      console.log('Server listening on port %d in %s mode', server.address().port, app.settings.env);
    });
  });// /init db

});
