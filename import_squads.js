var _ = require('underscore');

require('./squads').getSquads(function(err, squads){
	if (err){
		console.log('Unable to load squads', err);
		return process.exit(1);
	}
	if (!squads || !squads.length){
		console.log('No data loaded');
		return process.exit(1);
	}

	var alreadyDone = ['South Africa', 'Angola', 'Cape Verde'];

	//connect to db
	require('./config').getConfig(function(err, config) {
		if (err) { console.log("ERROR", err); process.exit(1); }
		global.platform_config = config;
		require('./db').getDb(function(err, db){
			if (err){
				console.log('Unable to load db info');
				return process.exit(1);
			}
			db.mongoose.connect(config.MONGODB);
			db.mongoose.connection.on('error', function(err){
				//should handle mongo errors here..
				console.log('mongoose error', err);
			});

			var end = _.after(squads.length, function(){process.exit(0);});
			_.each(squads, function(team){
				if (!_.contains(alreadyDone, team.team) && team.players && team.players.length){
					var endTeam = _.after(team.players.length, function(){end();});
					_.each(team.players, function(player){
						var dbPlayer = new db.Player(_.extend(player, {team:team.team}));
						dbPlayer.save(function(err){
							if (err){
								console.log('err');
							}
							else{
								console.log('success', dbPlayer._id);
							}
							endTeam();
						});
					});
				}
				else{
					end();
				}
			});
			
		});
	});
});