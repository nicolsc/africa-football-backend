exports.getDb = function(cb){
	var express = require('express');
	var mongoose = require('mongoose');
	var MongoStore = require('connect-mongo')(express);
	var bcrypt = require('bcrypt');


	// var MongoStore = new MongoStore({
 //          db:mongodb_config[3],
 //          host:mongodb_config[2].split(':')[0],
 //          port:parseInt(mongodb_config[2].split(':')[1],10)
 //        });

            


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
			positionPriority:Number,// GK:1, DF:2, ...
			dob:Date,
			club:String,
			number:Number,
			image:String
		}),
		user:new mongoose.Schema({
			name:{type:String, required: true, index: { unique: true } },
			password:{type:String, required:true},
			admin:Boolean
		}),
		session:new mongoose.Schema({
			_id:String,
			expires: Date,
			session : {
				lastAccess:Date,
				cookie:{
					originalMaxAge:Date,
					expires:Date,
					httpOnly:Boolean,
					path:String
				},
				user:{
					name:String,
					admin:Boolean
				}
			}
		})
	};

	schemas.player.pre('save', function(next){
		var priorities = {GK:1, DF:2, MF:2, FW:2};
		this.positionPriority = priorities[this.position] || 9;
		next();
	});

	schemas.user.methods.checkPassword = function(input, callback) {
		bcrypt.compare(input, this.password, function(err, result) {
			if (err) return cb(err);
			callback(null, result);
		});
	};

	var db = {
		Fixture: mongoose.model('Fixture',schemas.fixture),
		Player: mongoose.model('Player', schemas.player),
		User: mongoose.model('User', schemas.user),
		mongoose:mongoose,
		MongoStore:MongoStore
	};



	cb(null, db);

 
};


