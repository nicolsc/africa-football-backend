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
		})
	};

	schemas.fixture.methods.dump = function(){
		return JSON.stringify({team1:this.team1});
	};

	var db = {
		Fixture: mongoose.model('Fixture',schemas.fixture),
		mongoose:mongoose
	};

	cb(null, db);

 
};


