var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require("fs");
var timestamp = require ("unix-timestamp");

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
  res.sendFile(__dirname + '/main.html');
});

io.on('connection', function(socket){
	console.log('a user connected');
	socket.on('disconnect', function(){
		console.log('user disconnected');
	});

	socket.on('chat message', function(msg){
     io.emit('chat message', msg);

     //Now we write to database 
     var time = timestamp.now();

    db.serialize(function() {
		var stmt = db.prepare("INSERT INTO messagetable VALUES (?, ?, ?)");
		     stmt.run( msg, admin, time);

	     //query 
	     stmt.finalize();
	     db.each("SELECT msg FROM messagetable", function(err, res) {
	     	if (!err){
	     		console.log(res.msg);
	     	}
	     	else{
	     		console.log(err);
	     	}
	  	});


    });
     

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