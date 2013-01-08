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
			lastname:String,
			position:String,
			dob:Date,
			club:String,
			number:Number
		})
	};

	var db = {
		Fixture: mongoose.model('Fixture',schemas.fixture),
		Player: mongoose.model('Player', schemas.player),
		mongoose:mongoose
	};

	cb(null, db);

 
};


