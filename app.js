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
      app.engine('html', require('ejs').renderFile);

    });

    
    /**
    * GET /fixtures
    * List all fixtures
    **/
    app.get('/fixtures', function(req, res){
      if (!req.query || !req.query.callback){
        req.query.callback = 'callback';
      }
      
      db.Fixture.find({},null, {sort:{date:1}}, function(err, fixtures){
        if (err){
          return res.status(500).jsonp('An error occured : '+err);
        }
        if (!fixtures || !fixtures.length){
          return res.status(404).jsonp('Error : No results');
        }
        var data = [];

        _.each(fixtures, function(item){
          data.push(_.extend(item,schemaIO.fixture(item)));
        });

        res.jsonp(data);
      });

      
    });


    /**
    * GET /players
    * List all players
    **/
    app.get('/players', function(req, res){
      if (!req.query || !req.query.callback){
        req.query.callback = 'callback';
      }
      
      db.Player.find({},null, {sort:{team:1, number:1, name:1, firstname:1}}).exec(function(err, players){
        if (err){
          return res.status(500).jsonp('An error occured : '+err);
        }
        if (!players || !players.length){
          return res.status(404).jsonp('Error : No results');
        }
        var data = [];

        _.each(players, function(item){
          data.push(schemaIO.player(item));
        });

        res.jsonp(data);
      });

      
    });

    
    /*
    * GET /admin/fixtures
    * Edit/Delete existing fixtures
    * Create new fixture
    **/

    app.get('/admin/fixtures', function(req, res){

      db.Fixture.find({},null, {sort:{date:1}}, function(err, fixtures){
        res.render('fixtures.ejs', {err:err, fixtures:fixtures});
      });


    });
    /*
    * GET /admin/players
    * Edit/Delete existing players
    * Create new player
    **/
    app.get('/admin/players', function(req, res){

      db.Player.find({},null, {sort:{team:1, number:1, name:1, firstname:1}}, function(err, players){
        res.render('players.ejs', {err:err, players:players});
      });


    });


    app.post('/fixtures/new', function(req, res){

      var fixture = new db.Fixture(req.body);
      fixture.save(function(err){
        if (err){
          return res.status(500).send(err);
        }
        return res.json(fixture);
      });

    });


    /*
    * POST /players/new
    * Register new player
    **/
     app.post('/players/new', function(req, res){

      var player = new db.Player(req.body);
      player.save(function(err){
        if (err){
          return res.status(500).send(err);
        }
        return res.json(player);
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

    var schemaIO = {
      fixture:function(fix){
        var article = {};
        article.name = fix.team1 + ' - '+fix.team2;
        if (fix.score){
          article.name += ' '+fix.score;
        }
        if (fix.date){
          article.dateCreated = fix.date;
        }
        article.description = fix.stage;

        return article;
      },
      player:function(p){
         var article = {};
         article.familyname = ''+p.name;
        article.name = (p.firstname && p.firstname.length ? p.firstname.substring(0,1)+'.':'' )+ p.name;
        article.description = '';
        if (p.number){
          article.description += '#'+p.number+'. ';
        }
        if (p.position){
          article.description += '('+p.position+')';
        }
        if (p.club){
          article.description += ", "+p.club;
        }

        article.dateCreated = p.dob;

        /* still need them..*/
        article.position = p.position;
        article.club = p.club;
        article.number = p.number;
        article._id = p.id;
        
        return article;
      }

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
