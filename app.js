process.chdir(__dirname);


var express = require('express'),
    http=require('http'),
    _ = require('underscore')._,
    fs = require('fs'),
    path = require("path"),
    request = require('request'),
    dateformat=require('dateformat'),
    bcrypt = require('bcrypt'),
    ObjectId = require('mongoose').Types.ObjectId,
    MongoStore = require('connect-mongo')(express);

var checkAdmin = function(req, res, next){
      if (!req.session || !req.session.user || !req.session.user.admin){
        return res.redirect('/login');
      }
      next();
    };


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

    
  // Configuration
  
  var mongodb_config = config.MONGODB.split('/');
  /*
    0 : mongodb:
    1 : ""
    2 : host:port
    3 : db_name
  */
    app.configure(function() {
      app.use(express.bodyParser());
      app.use(express.cookieParser());
      app.use(express.session({
        store: new db.MongoStore({
          url: config.MONGODB
        }),
        secret: 'not keyboard cat',
        cookie: {maxAge: 3600000 ,  secure: false, httpOnly:false }
      }));
      app.use(express.methodOverride());
      app.use(express.static('public'));
      app.engine('html', require('ejs').renderFile);

    });

    app.get('/session', function(req, res){
      res.json(req.session);
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
          return res.status(500).jsonp({msg:'An error occured : '+err});
        }
        if (!fixtures || !fixtures.length){
          return res.status(404).jsonp({msg:'Error : No results'});
        }
        var data = [];

        _.each(fixtures, function(item){
          data.push(schemaIO.fixture(item));
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
      
      db.Player.find({},null, {sort:{team:1, positionPriority:1,  lastname:1, firstname:1}}).exec(function(err, players){
        if (err){
          return res.status(500).jsonp({msg:'An error occured : '+err});
        }
        if (!players || !players.length){
          return res.status(404).jsonp({msg:'Error : No results'});
        }
        var data = [];

        _.each(players, function(item){
          data.push(schemaIO.player(item));
        });

        res.jsonp(data);
      });

      
    });
    /**
    * GET /squads
    * List all players, 'grouped'by team
    * 'grouped' meaning, there is a line with the team name before its players listing
    **/
    app.get('/squads', function(req, res){
      if (!req.query || !req.query.callback){
        req.query.callback = 'callback';
      }
      var data =[];
      var tmp;
      db.Player.find({},null, {sort:{team:1, positionPriority:1,  lastname:1, firstname:1}}).exec(function(err, players){
        if (err){
          return res.status(500).jsonp({msg:'An error occured : '+err});
        }
        if (!players || !players.length){
          return res.status(404).jsonp({msg:'Error : No results'});
        }
        

        _.each(players, function(player){
         /* tmp = _.find(data, function(item, key){
            return item.name == player.team;
          });
          if (!tmp){
            data.push({name:player.team, players:[]});
            tmp = _.find(data, function(item, key){
              return item.name == player.team;
            });
          }
          tmp.players.push(schemaIO.player(player));

          */
          if (!_.find(data, function(item, key){return item.name==player.team;})){
            data.push({name:player.team, description:'Coming soon...'});
          }
          data.push(schemaIO.player(player));
        });

        res.jsonp(data);
      });

      
    });



    /**
    * POST /fixtures
    */
    app.post('/fixtures', checkAdmin,function(req, res){

      var fixture = new db.Fixture(req.body);
      fixture.save(function(err){
        if (err){
          return res.status(500).json({msg:err});
        }
        return res.json(schemaIO.fixture(fixture));
      });

    });

    /**
    * GET /fixtures/:id
    **/
    app.get('/fixtures/:id', function(req, res){
      if (!req.params || !req.params.id){
        res.status(400).json({'msg':'Missing param `id`'});
      }
      db.Fixture.findOne({_id:req.params.id}, function (err, doc){
        if (err){
          return res.status(500).json({msg:'Unexpected error while retrieving document: '+err});
        }
        if (!doc){
          return res.status(404).json({msg:'Document not found'});
        }
        res.jsonp(schemaIO.fixture(doc));
      });
    });

    /**
    * DELETE /fixtures/:id
    **/
    app.delete('/fixtures/:id', checkAdmin,function(req, res){
      if (!req.params || !req.params.id){
        res.status(400).json({'msg':'Missing param `id`'});
      }
      db.Fixture.remove({_id:req.params.id}).exec(function(err, num){
        if (err){
          return res.status(500).json({msg:'Unexpected error while removing document : '+err});
        }
        if (!num){
          return res.status(404).json({msg:'Zero documents affected'});
        }
        res.json({msg:num+' documents removed'});
      });
    });
    /**
    * PUT /fixtures/:id
    **/
    app.put('/fixtures/:id',checkAdmin, function(req, res){
      if (!req.params || !req.params.id){
        res.status(400).json({'msg':'Missing param `id`'});
      }
      db.Fixture.findOne({_id:req.params.id}, function (err, doc){
        if (err){
          return res.status(500).json({msg:'Unexpected error while updating document: '+err});
        }
        if (!doc){
          return res.status(404).json({msg:'Document not found'});
        }
        _.each(req.body, function(val, key){
          doc[key] = val;
        });
        doc.save();
        res.json(schemaIO.fixture(doc));

      });
    });


    /**
    * POST /players
    */
    app.post('/players', checkAdmin,function(req, res){

      var player = new db.Player(req.body);
      player.save(function(err){
        if (err){
          return res.status(500).json({msg:err});
        }
        return res.json(schemaIO.player(player));
      });

    });

    /**
    * GET /players/:id
    **/
    app.get('/players/:id', function(req, res){
      if (!req.params || !req.params.id){
        res.status(400).json({'msg':'Missing param `id`'});
      }
      db.Player.findOne({_id:req.params.id}, function (err, doc){
        if (err){
          return res.status(500).json({msg:'Unexpected error while retrieving document: '+err});
        }
        if (!doc){
          return res.status(404).json({msg:'Document not found'});
        }
        res.jsonp(schemaIO.player(doc));
      });
    });

    /**
    * DELETE /players/:id
    **/
    app.delete('/players/:id',checkAdmin , function(req, res){
      if (!req.params || !req.params.id){
        res.status(400).json({'msg':'Missing param `id`'});
      }
      db.Player.remove({_id:req.params.id}).exec(function(err, num){
        if (err){
          return res.status(500).json({msg:'Unexpected error while removing document : '+err});
        }
        if (!num){
          return res.status(404).json({msg:'Zero documents affected'});
        }
        res.json({msg:num+' documents removed'});
      });
    });
    /**
    * PUT /players/:id
    **/
    app.put('/players/:id', checkAdmin, function(req, res){
      if (!req.params || !req.params.id){
        res.status(400).json({'msg':'Missing param `id`'});
      }
      db.Player.findOne({_id:req.params.id}, function (err, doc){
        if (err){
          return res.status(500).json({msg:'Unexpected error while updating document: '+err});
        }
        if (!doc){
          return res.status(404).json({msg:'Document not found'});
        }
        _.each(req.body, function(val, key){
          doc[key] = val;
        });
        doc.save();
        res.json(schemaIO.player(doc));

      });
    });


    /* admin area */
    /**
    * GET /register
    * display register form
    **/
    app.get('/register', function(req, res){
      res.render('register.ejs');
    });

   
    /**
    * GET /login
    * display login form
    **/
    app.get('/login', function(req, res){
      res.render('login.ejs');
    });

    /**
    * POST /login
    * attempt to log in
    **/
    app.post('/login', function(req, res){
      if (!req.body || !req.body.name || !req.body.password){
        return res.status(400).json({msg:'Missing parameters'});
      }
      db.User.findOne({name:req.body.name}).exec(function(errFind, user){
        if (errFind){
          return res.status(500).json({msg:errFind});
        }
        if (!user){
          return res.send(403);
        }
        user.checkPassword(req.body.password, function(errCheck, resCheck){
          if (errCheck){
            return res.status(500).json({msg:'Unable to check password '+errCheck});
          }
          if (!resCheck){
            return res.send(403);
          }
          req.session.user = user;
          return res.json(user);
        });
      });
    });

    /**
    * GET /admin
    * home menu
    **/
    app.get('/admin', checkAdmin, function(req, res){
      if (req.session && req.session.user){
        return res.render('admin.ejs', {user:req.session.user});
      }
      res.redirect('/login');
    });
    /*
    * GET /admin/fixtures
    * Edit/Delete existing fixtures
    * Create new fixture
    **/

    app.get('/admin/fixtures', checkAdmin, function(req, res){

      db.Fixture.find({},null, {sort:{date:1}}, function(err, fixtures){
        var data=[];
        _.each(fixtures, function(item){
          data.push(schemaIO.fixture(item));
        });

        res.render('fixtures.ejs', {err:err, fixtures:data});
      });




    });
    /*
    * GET /admin/players
    * Edit/Delete existing players
    * Create new player
    **/
    app.get('/admin/players', checkAdmin, function(req, res){

      db.Player.find({},null, {sort:{team:1, number:1, name:1, firstname:1}}, function(err, players){
        var data=[];
        _.each(players, function(item){
          data.push(schemaIO.player(item));
        });
        res.render('players.ejs', {err:err, players:data});
      });


    });

    /**
    * GET /users
    **/
    app.get('/users', checkAdmin, function(req, res){
      db.User.find({}).exec(function(err, users){
        if (err){
          return res.status(500);
        }
        var data=[];
        _.each(users, function(item){
          data.push({name:item.name, admin:item.admin});
        });
        res.json(data);
      });
    });
     /**
    * POST /users
    * New user
    **/
    app.post('/users', function(req, res){
      if (!req.body || !req.body.name || !req.body.password){
        return res.status(400).json({msg:'Missing parameters'});
      }

      db.User.count({name:req.body.name}, function(errFind, count){
        if(err){
          return res.status(500).json({msg:err || 'unknown error #1'});
        }
        if (count>0){
          return res.status(403).json({msg:'Already '+count+' users with this `name`'});
        }
        var user = {};
        user.name = req.body.name;
        user.salt = bcrypt.genSaltSync(10);
        user.password = bcrypt.hashSync(req.body.password, user.salt);
        db.User.create(user, function(err, doc){
          if (err || !doc){
            return res.status(500).json({msg:err || 'unknown error #2'});
          }
          res.json({name:doc.name, id:doc._id});
        });
      });

      
    });

    app.get('/', function(req, res){
      return fourofour(req,res);
    });


    /* utils */

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
          article.startDate = fix.date;
        }
        article.description = dateformat(fix.date, 'dd/mm HH:MM')+' - '+fix.stage;

        /* still need them */
        article.stage = fix.stage;
        article.team1 = fix.team1;
        article.team2 = fix.team2;
        article.score = fix.score;
        article.id = fix._id;


        return article;
      },
      player:function(p){
         var article = {};
        article.name = (p.firstname && p.firstname.length ? p.firstname.substring(0,1)+'.':'' )+ p.lastname;
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

        //article.dateCreated = p.dob;
        article.dob = p.dob;
        article.image = p.image;

        /* still need them..*/
        article.position = p.position;
        article.club = p.club;
        article.number = p.number;
        article.firstname = p.firstname;
        article.lastname = p.lastname;
        article.id = p.id;
        article.team = p.team;

        
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