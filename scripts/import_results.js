var _ = require('underscore'),
	dateformat=require('dateformat'),
	jsdom = require('jsdom');

var now = new Date();
console.log('### import results ###');
console.log(now);

if (dateformat(now, 'yyyy-mm-dd')<'2013-01-31'){
	getGamesFromWebPages(['http://www.lequipe.fr/Football/FootballResultatGroupe5448.html',
				'http://www.lequipe.fr/Football/FootballResultatGroupe5449.html',
				'http://www.lequipe.fr/Football/FootballResultatGroupe5450.html',
				'http://www.lequipe.fr/Football/FootballResultatGroupe5451.html'],
				{game:".content .ligne", home:'.equipeDom', away:'.equipeExt', score:'.score'},
				importGames);
}
else{
	/*
	* Forget about importing data from the 'Tableau final', the score display is messy & would need some extra work
	getGamesFromWebPages('http://www.lequipe.fr/Football/FootballTableau1881.html',
				{game:'.itm', home:'.clubeq:first', away:'.clubeq:last', score:'.score_unique'},
				importGames);
	*/
	getGamesFromWebPages([//'http://www.lequipe.fr/Football/FootballResultatGroupe5452.html', //Quarter-finals
				//'http://www.lequipe.fr/Football/FootballResultatGroupe5453.html', //Semi finals
				'http://www.lequipe.fr/Football/FootballResultat44318.html',//third place game
				'http://www.lequipe.fr/Football/FootballResultat44317.html'], //Final
				{game:".content .ligne", home:'.equipeDom', away:'.equipeExt', score:'.score'},
				importGames);}

/**
* Get games from web
* @param {Array} urls web pages to scrap
* @param {Object} selectors
* @param {String} selectors.game CSS selector to get each game
* @param {String} selectors.home CSS selector to get home team name
* @param {String} selectors.away CSS selector to get away team name
* @param {String} selectors.score CSS selector to get score
* @param {Function} callback called after scrapping each url
**/
function getGamesFromWebPages(urls, selectors,callback){
	if (typeof urls == 'string'){
		urls = [urls];
	}
	var oneMoreRequest = _.after(urls.length, function cb(){callback(games);});
	var games = [];
	urls.forEach(function(url){
		jsdom.env({
			html: url, //scrap that url
			scripts: ["http://code.jquery.com/jquery.js"], //use jquery
			done: function done(errors, window) {
				window.$(selectors.game).each(function() {
					games.push({
						team1:teams_matching[window.$(selectors.home, this).text().trim()],
						team2:teams_matching[window.$(selectors.away, this).text().trim()],
						score:window.$(selectors.score, this).text().trim()
					});
				});
				return oneMoreRequest();
			}
		});

	});
}

function importGames(games){
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
}

function findGame(db, game, callback){

	db.Fixture.find({team1:game.team1, team2:game.team2, score:{$or:['', 'undefined']}}, null, {}).exec(function(err, docs){
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
		/* if game was reversed, need to adjust score */
		if (game.reverse){
			var tmpScore = game.score.split(' - ');
			if (tmpScore.length && tmpScore.length > 1){
				tmpScore[1] = tmpScore[1].split(' ');
				game.score = tmpScore[1][0] + ' - '+tmpScore[0];
				if (tmpScore[1].length > 1){
					tmpScore[1].shift();
					game.score += ' - '+tmpScore.join(' ');
				}
			}
		}

		docs[0].score=game.score;
		docs[0].save(function(err){
			callback();
		});
	});
}


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
