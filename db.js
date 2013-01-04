exports.getDb = function(cb){
	var mongoose = require('mongoose');
	//var MongoStore = require('connect-mongo')(require('express'));
	var  _ = require('underscore');

	var schemas = {
		fixture : new mongoose.Schema({
			date:Date,
			team1:String,
			team2:String,
			score:String,
			place:String,
			details:String,
			stage:String
		}),
		player: new mongoose.Schema({
			team:String,
			firstname:String,
			name:String,
			position:String,
			dob:Date,
			club:String,
			number:Number
		})
	};

	schemas.player.dump = function(){
		return {
			name:this.firstname ? this.firstname.substring(0,1)+'.' : '' + this.name,
			description: (this.position ? "Pos.: "+this.position+'\n' : '') + (this.club ? "Club: "+this.club : '')
		};
	};

	var db = {
		Fixture: mongoose.model('Fixture',schemas.fixture),
		Player: mongoose.model('Player', schemas.player),
		mongoose:mongoose
	};

	cb(null, db);

 
};


