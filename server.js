
// server.js
// modules
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var mongoose = require('mongoose');
var database = require('./jada_/config/database');

var http = require('http').Server(app);
var io = require('socket.io')(http);

// configuration

// config files
mongoose.Promise = global.Promise;
mongoose.connect(database.remoteUrl);

// set ports
var port = process.env.PORT || 1003;

// DATABASE
require('./jada_/config/routes.js')(app);

// get all data of the body (POST) params
// parse application/json
app.use(bodyParser.json());

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json'}) );

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// override with the X-HTTP-Method-Override header in the request. simulate DELETE
app.use(methodOverride('X-HTTP-Method-Override'));

//app.use(express.static(__dirname + '/public'));
app.engine('.html', require('ejs').__express);
app.use(express.static('./public'));
app.set('views', __dirname + '/public/views');
app.set('view engine', 'html');

app.get('/', function(req, res){
	res.render('index');
});

// socket connection
io.on('connection', function(socket){
	var userId = socket.handshake.query.userid;
  console.log(userId + ' connected on socket: ' + socket.id);

	// general message
	socket.on('general', function(msg){
    //console.log(msg);
		io.emit('general', msg);
  });

	// socket disconnection
	socket.on('disconnect', function(){
    console.log(userId + ' disconnected: ' + socket.id);
  });

	// private message
	socket.on('private message',function(info){
		//console.log(info);
		io.to(info.privateId).emit('private message', info.info);
	});

	// Chat Room
	// join room
	socket.on('join room',function(info){
		console.log(info.info.userId + " is joining room " + info.roomId)
		socket.join(info.roomId);
	});

	// leave room
	socket.on('leave room',function(info){
		console.log(info.info.userId + " is leaving room " + info.roomId);
		socket.leave(info.roomId);
	});

	// room message
	socket.on('room message',function(info){
		//console.log(info);
		io.to(info.roomId).emit('room message', info.info);
	});
});

// start app
//app.listen(port);
http.listen(port, function(){
	console.log('Application is open on port ' + port);
});

// User message
//console.log('Application is open on port ' + port);
