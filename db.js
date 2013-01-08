exports.getDb = function(cb){
	var mongoose = require('mongoose');
	//var MongoStore = require('connect-mongo')(require('express'));
	var bcrypt = require('bcrypt');
	var schemas = {
		fixture : new mongoose.Schema({
			date:{type:Date, required:true},
			team1:{type:String, required:true},
			team2:{type:String, required:true},
			score:String,
			place:String,
			details:String,
			stage:String
		}),
		player: new mongoose.Schema({
			team:{type:String, required:true, index:true},
			firstname:String,
			lastname:{type:String, required:true},
			position:String,
			dob:Date,
			club:String,
			number:Number,
			image:String
		}),
		user:new mongoose.Schema({
			name:{type:String, required: true, index: { unique: true } },
			password:{type:String, required:true},
			admin:Boolean
		})
	};

	schemas.user.methods.checkPassword = function(input, callback) {
		bcrypt.compare(input, this.password, function(err, result) {
			console.log('bcrypt res', err, result);
			if (err) return cb(err);
			callback(null, result);
		});
	};

	var db = {
		Fixture: mongoose.model('Fixture',schemas.fixture),
		Player: mongoose.model('Player', schemas.player),
		User: mongoose.model('User', schemas.user),
		mongoose:mongoose
	};



	cb(null, db);

 
};


