var extend = require("xtend");
var moment = require("moment");
var repos = require('./repos');

exports.test = function(req, res) {
	res.json(repos);
}

exports.index = function(req, res) {
	var model = {
		repos : values(repos).map(function(repo) {
			return {
				repository : repo.name,
				repo_url : "/repo/" + repo.name,
				events_latest : getLatestEvents(repo)
			}
		})
	};
	view(res, "index", model);
}

exports.repo = function(req, res) {
	var remote = req.params.remote;
	var repo_name = req.params.repo;
	var repo = repos[repo_name];

	var filter;
	if (remote) 
		filter = (function(event) {	return event.remote == remote;	});
	
	var model = {
		repository : repo_name,
		remote : remote,
		events : getEvents(repo, filter),
		events_latest : getLatestEvents(repo, filter),
	}
	view(res, "repo", model);
}

function getLatestEvents(repo, filter) {
	var events = {};
	getEvents(repo, filter).reverse().forEach(function (event) {
		events[event.type + "/" + event.remote + "/" + event.branch] = event;
	});
	events = values(events);
	sortEvents(events);
	return addRevisionGroups(events);
}

function addRevisionGroups(events) {
	var groups = {};
	var group = 0;
	events.forEach(function(event) {
		if (!groups[event.revision])
			groups[event.revision] = ++group;
		extend(event, { revision_group : group});
	});
	return events;
}

function getEvents(repo, filter) {
	var events_new = [];
	var events = repo.events;
	if (filter)
		events = events.filter(filter);
	events.forEach(function(event) {
		var event_new = extend({}, event, { 
			revision_short : event.revision.substr(0, 7),
			remote_name : repo.config.remotes[event.remote].name,
			date_short : moment(event.date).format("YYYY-MM-DD HH:mm"),
		});
		events_new.push(event_new);
	});
	sortEvents(events_new);
	return addRevisionGroups(events_new);
}

function values(hash) {
	var array = [];
	for (key in hash)
		array.push(hash[key]);
	return array;
}

exports.rev = function(req, res) {
	var repo_name = req.params.repo;
	var rev = req.params.rev;
	var events = getEvents(repos[repo_name]);
	events = events.filter(function(event) {
		return event.revision == rev;
	});

	var model = {
		repository : repo_name,
		revision : rev,
		events : events,
	}
	view(res, "rev", model);
}

exports.diff = function(req, res) {
	console.log("diff controller");
	var repo = req.params.repo;
	var rev1 = req.params.rev1;
	var rev2 = req.params.rev2;
	repos[repo].git.exec("log", ["--graph", "--oneline", rev1 + ".." + rev2], function (err, msg) {
		console.log(msg);
		res.render("index", { content : "<pre>" + msg + "</pre>"});
	});
}

function sortEvents(events) {
	events.sort(function(a,b) { return b.date.localeCompare(a.date); });
}

var global_partials = {
	event : "views/event.mustache"
}


function view(res, view, data) {
	data = data || {};
	console.log("view: " + view);
	res.format({
		"text/html": function() {
			data.partials = extend({}, global_partials, data.partials || {});
			extend(data, { repo_url : "/repo/" + data.repository});
			res.render(view, data, function(err, html) {
				res.render("template", { content : html});
			})
		},
		"application/json": function() {res.json(data)}
	});
}
