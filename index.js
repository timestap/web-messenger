var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require("fs");
var timestamp = require ("unix-timestamp");
var jade = require('jade');
var bodyParser = require('body-parser');
var json = require('express-json');
var moment = require('moment');

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: true
})); 

//jade template for login page
var html_login = jade.renderFile('login.jade', {});

//Setting up the database

//The table will be of the format 
//Message Text | Username | Timestamp
var file = "msg.db";
var exists = fs.existsSync(file);

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(file);

//Create table 
db.serialize(function() {
	if(!exists) {
	db.run("CREATE TABLE messagetable (msg TEXT, username TEXT, time INT)"); 
	}
});

//test username
var admin = "administrator";

app.get('/', function(req, res){
	res.send(html_login);
});

app.post('/', function(req, res) {
	var username = req.body.username;
	res.cookie('username', username, { httpOnly: false });
	res.redirect('/chatroom');
});

//login page
app.get('/chatroom', function(req, res){
	res.sendFile(__dirname + '/main.html');
});

//serving css files
app.get('/css/chat.css', function(req, res){
	res.sendFile(__dirname + '/css/chat.css');
});


io.on('connection', function(socket){
	console.log('a user connected');
	socket.on('disconnect', function(){
		console.log('user disconnected');
	});

	socket.on('chat message', function(msg_obj){
		console.log(msg_obj);

	 //Now we write to database 
	 var time = timestamp.now();
	 var time_moment = moment().format('MMMM Do YYYY, h:mm:ss a');
	 console.log(time_moment);
	 io.emit('chat message', {message_contents: msg_obj.msg_contents, 
	 	username: msg_obj.username, 
	 	cur_time: time_moment
	 });

	//   db.serialize(function() {
		// var stmt = db.prepare("INSERT INTO messagetable VALUES (?, ?, ?)");
		//      stmt.run( msg, admin, time);

	 //     //query 
	 //     stmt.finalize();
	 //     db.each("SELECT msg FROM messagetable", function(err, res) {
	 //     	if (!err){
	 //     		console.log(res.msg);
	 //     	}
	 //     	else{
	 //     		console.log(err);
	 //     	}
	 //  	});


	//   });
	 

	});
});

process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
	if (options.cleanup) console.log('clean');
	if (err) console.log(err.stack);
	if (options.exit) process.exit();

	//close database
	db.close();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

http.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});