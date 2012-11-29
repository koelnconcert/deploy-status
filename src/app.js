var connect = require('connect');
var express = require('express');
var consolidate = require('consolidate');
var controller = require('./controller');

var port = 8009;

function init() {
	console.log("creating app...");

	var app = express();
	app.use(connect.logger());
	app.use(connect.static(__dirname + "/../static"));
	app.use(redirectIfTrailingSlash); 
	
	app.engine('html', consolidate.mustache);
	app.set('view engine', 'html');
	app.set('views', __dirname + '/../views')

	app.get('/', controller.index);
	app.get('/test', controller.test);
	app.get('/repo/:repo', controller.repo);
	app.get('/repo/:repo/remote/:remote', controller.repo);
	app.get('/repo/:repo/rev/:rev', controller.rev);
	app.get('/repo/:repo/diff/:rev1/:rev2', controller.diff);
	
	app.listen(port);
	console.log("server listening on port " + port + ".");
}

function redirectIfTrailingSlash(req, res, next) {
	if (req.path.match(".+/$")) 
		res.redirect(req.path.slice(0,-1));
	else
		next();
}

init();