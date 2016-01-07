/*
------------
Dependencies
------------
*/
require('newrelic');
var express        = require('express');
var session        = require('express-session');
var crypto         = require('crypto');
var bcrypt         = require('bcrypt');
var https          = require('https');
var http           = require('http');
var fs             = require('fs');
var favicon        = require('serve-favicon');
var url            = require('url');
var path           = require('path');
var morgan         = require('morgan');
var log4js         = require('log4js');
var multer         = require('multer');
var bodyParser     = require('body-parser');
var cookieParser   = require('cookie-parser');
var wevaya         = require('./routes/wevaya');
var MongoStore     = require('connect-mongo')(session);

/*
-----------
Express App
-----------
*/
var app            = express();

/*
---------
SSL Certs
---------
*/
var ca, chain, cert, line, requestHandler, _i, _len;
ca = [];
chain = fs.readFileSync('./certs/ssl-bundle.cer', 'utf8');
chain = chain.split('\n');
cert = [];

for (_i = 0, _len = chain.length; _i < _len; _i++) {
  line = chain[_i];
  if (!(line.length !== 0)) {
    continue;
  }
  cert.push(line);
  if (line.match(/-END CERTIFICATE-/)) {
    ca.push(cert.join('\n'));
    cert = [];
  }
}

var credentials = {
  ca: ca,
  key: fs.readFileSync('./certs/privatekey.crt', 'utf8'),
  cert: fs.readFileSync('./certs/certificate.crt', 'utf8')
};

/*
--------
Log shit
--------
*/
var theAppLog = log4js.getLogger();
var theHTTPLog = morgan("combined", {
	"stream": {
		write: function(str) {
    	theAppLog.debug(str);
    }
  }
});
var logfile = fs.createWriteStream('./logfiles/requests.log', {flags: 'a'});
app.use(theHTTPLog);
app.use(morgan('combined', {stream: logfile}));

/*
----------------
All Environments
----------------
*/
var secret = 'sexysaxman';

var compression    = require('compression');
app.use(compression());

var oneDay = 86400000;

app.use(express.static(__dirname + '/public', { maxAge: oneDay }));
app.use('/bower_components', express.static(__dirname + '/bower_components', { maxAge: oneDay }));
app.use(cookieParser(secret));
app.use(bodyParser());
app.set('port', process.env.PORT || 443);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(favicon(__dirname + '/public/images/favicon.ico'));

app.use(function(req, res, next) {
  var handler = multer({
    dest: __dirname + '/public/tmp/',
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 10,
      parts: 10
    },
    onFileUploadStart: function (file) {
      if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpg' && file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/gif') {
        return false;
      }
    }
  });
  handler(req, res, next);
});

/*
 --------
 Sessions
 --------
 */
var mongoStore = new MongoStore({
  db: 'wevaya',
  collection: 'sessions'
});
app.use(session({
  secret  : 'sexysaxman',
  cookie  : {
    secure: true,
    maxAge  : 1000 * 60 * 60 * 24 * 7
  },
  store   : mongoStore
}));

/*
  ------
  Routes
  ------
  Stop trying to make fetch happen... it's never going to happen
  Actually... we made it happen.
*/
var beta = express.Router();
beta.get('/', wevaya.betaGet);
beta.post('/', wevaya.betaPost);

var home = express.Router();
home.get('/', wevaya.index);
home.get('/profile/:userID', wevaya.index);
home.post('/', wevaya.index);

var ball = express.Router();
ball.get('/', wevaya.postBall);
ball.post('/', wevaya.postBall);

var verify = express.Router();
verify.get('/', wevaya.verify);
verify.post('/', wevaya.verify);

var addedApi=express.Router();
addedApi.get('/',wevaya.addedApi);
addedApi.post('/',wevaya.addedApi);


app.use('/', home);
app.use('/ayavew', home);
// app.use('/', function(req, res) {
//   res.render('construction');
// });
app.use('/api',addedApi);
app.use('/beta', beta);
app.use('/fetch', ball);
app.use('/ayavew/fetch', ball);
app.use('/verify', verify);
app.get('/reset-password/:userToken', function(req, res) {
  res.render('resetPassword', {token: req.params.userToken});
});
app.get('/cancel-reset-password/:userToken', wevaya.cancelPasswordReset);

/*
-------------
Default Error
-------------
*/
app.use(function(req, res) {
  res.render('error');
});
app.use(function(err, req, res, next) {
  res.render('error');
});

/*
 ----------------
 Start Up MongoDB
 ----------------
 If mongoDB is already up, this just returns a safe error and keeps going with execution.
*/
function startDatabase() {
  var exec = require('child_process').exec;

  exec('mongod --dbpath data/ --fork --logpath logfiles/mongodb.log', function (error, stdout, stderr) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
  });
}
//startDatabase();

/*
-------------------
Create Secure Sever // use 96.30.59.234 in production and 96.30.59.235 in development
-------------------
*/
var server = https.createServer(credentials, app).listen(443, '192.168.1.34', function() {
    console.log('Express server listening on port ' + app.get('port'));
});
//var server = https.createServer(credentials, app).listen(443, '96.30.59.234', function() {
//    console.log('Express server listening on port ' + app.get('port'));
//});

/*
-----------------------------
Redirect to Secure Connection // use 96.30.59.234 in production and 96.30.59.235 in development
-----------------------------
*/
http.createServer(
        function(req, res, next) {
  res.writeHead(301, {'Location': 'https://' + req.headers.host + req.url });
  res.end();
}
        ).listen(80, '192.168.1.34', function() {
  console.log('redirection activated');
});

/*
 ----------------
 Socket I/O stuff
 ----------------
 */
var io = require('socket.io')(server);

var cookieParser = require("cookie-parser");
io.use(function ioSession(socket, next) {

  var req = {
    "headers": {
      "cookie": socket.request.headers.cookie,
    },
  };

  //console.log(socket.request);

  cookieParser(secret)(req, null, function() {});

  socket.sessionID = req.signedCookies['connect.sid'] || req.cookies['connect.sid'];
  next();
});

io.on('connection', function (socket) {

  // socket.sessionID
  wevaya.socketHandler(io, socket);
});
