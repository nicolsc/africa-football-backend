var _ = require('underscore'),
	jsdom = require('jsdom');


console.log('### import results ###');
console.log(new Date());

var urls = ['http://www.lequipe.fr/Football/FootballResultatGroupe5448.html',
			'http://www.lequipe.fr/Football/FootballResultatGroupe5449.html',
			'http://www.lequipe.fr/Football/FootballResultatGroupe5450.html',
			'http://www.lequipe.fr/Football/FootballResultatGroupe5451.html'];

var oneMoreRequest = _.after(urls.length, function cb(){importGames(games);});
var games = [];
urls.forEach(function(url){

	jsdom.env({
		html: url, //scrap that url
		scripts: ["http://code.jquery.com/jquery.js"], //use jquery
		done: function done(errors, window) {
			window.$(".content .ligne").each(function() {
				games.push({
					team1:teams_matching[window.$('.equipeDom', this).text().trim()],
					team2:teams_matching[window.$('.equipeExt', this).text().trim()],
					score:window.$('.score', this).text().trim()
				});
			});
			return oneMoreRequest();
		}
	});

});

var importGames = function importGames(games){
	var end = _.after(games.length, function(){process.exit(0);});
	require('../config').getConfig(function(err, config) {
		if (err) { console.log("ERROR", err); process.exit(1); }
		global.platform_config = config;
		require('../db').getDb(function(err, db){
			if (err){
				console.log('Unable to load db info');
				return process.exit(1);
			}

			db.mongoose.connect(config.MONGODB);
			db.mongoose.connection.on('error', function(err){
				//should handle mongo errors here..
				console.log('mongoose error', err);
			});

			games.forEach(function(game){
				if (!game.team1 || !game.team2){
					//unknown teams?
					end();
					return false;
				}
				if (game.score.match(/([0-9]*)h([0-9]*)/)){
					console.log('no score yet',game.team1, game.team2, game.score);
					end();
					return false;
				}

				findGame(db, game, end);

			});
		});
	});
};

var findGame = function (db, game, callback){

	db.Fixture.find({team1:game.team1, team2:game.team2}, null, {}).exec(function(err, docs){
		if (err){
			console.log('error while finding game', game, err);
			return callback();
		}
		if (docs.length===0){
			if (game.reverse){
				console.log('game not found', game);
				return callback();
			}
			var tmp = game.team1;
			game.team1 = game.team2;
			game.team2 = tmp;
			game.reverse=true;
			return findGame(db, game, callback);
		}
		if (docs.length > 1){
			console.log('problem : several games looking like', game);
			return callback();
		}
		docs[0].score=game.score;
		docs[0].save(function(err){
			callback();
		});
	});
};



var teams_matching = {
	'AFRIQUE DU SUD':'South Africa',
	'ALGERIE':'Algeria',
	'ANGOLA':'Angola',
	'BURKINA FASO':'Burkina Faso',
	'CAP VERT':'Cape Verde',
	'CÔTE D IVOIRE':'Ivory Coast',
	'ETHIOPIE':'Ethiopia',
	'GHANA':'Ghana',
	'MALI':'Mali',
	'MAROC':'Morocco',
	'NIGER':'Niger',
	'NIGERIA':'Nigeria',
	'RD CONGO':'DR Congo',
	'TUNISIE':'Tunisia',
	'TOGO':'Togo',
	'ZAMBIE':'Zambia'
};
