var extend = require("xtend");
var moment = require("moment");
var repos = require('./repos');

var base_url = "/node/";

exports.test = function(req, res) {
	res.json(repos);
}

exports.index = function(req, res) {
	var repos_model = values(repos).map(function(repo) {
		return {
			repo : repo.name,
			updated_ago : moment(repo.updated).fromNow(),
			updated : repo.updated,
			events_latest : getLatestEvents(repo)
		}
	});
	repos_model.sort(function(a,b) {
		return eventSorter(a.events_latest[0], b.events_latest[0]);
	});

	var model = { repos : repos_model };
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
		repo : repo_name,
		updated : repo.updated,
		updated_ago : moment(repo.updated).fromNow(),
		remote : remote,
		events : getEvents(repo, filter),
		events_latest : getLatestEvents(repo, filter),
	}
	view(res, remote?"remote":"repo", model);
}

function getLatestEvents(repo, filter) {
	var events = {};
	getEvents(repo, filter).reverse().forEach(function (event) {
		events[event.type + "/" + event.remote + "/" + event.branch] = event;
	});
	events = values(events);
	events.sort(eventSorter);
	return addRevisionGroups(events);
}

function addRevisionGroups(events) {
	var groups = {};
	var group = 0;
	events.forEach(function(event) {
		if (!groups[event.revision])
			groups[event.revision] = ++group;
		extend(event, { revision_group : groups[event.revision]});
	});
	return events;
}

function getEvents(repo, filter) {
	repo.refresh();
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
	events_new.sort(eventSorter);
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
		repo : repo_name,
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
	var model = {
			repository : repo,
			rev1 : rev1,
			rev2 : rev2,
	};
	repos[repo].git.exec("diff", [ rev1 + ".." + rev2], function (err, msg) {
		model.diff = msg;
		repos[repo].git.exec("diff", [ "--stat", rev1 + ".." + rev2], function (err, msg) {
			model.stat = msg;
			repos[repo].git.exec("log", ["--graph", "--boundary", "--format='%h [%cr] <%an> %s'", rev1 + "..." + rev2], function (err, msg) {
				model.log = msg;
				view(res, "diff", model);
			});
		});
	});
}

function eventSorter(a,b) {
	return b.date.localeCompare(a.date);
}

var global_partials = {
	event : "views/event.mustache",
	updated : "views/updated.mustache"
}


function view(res, view, data) {
	data = data || {};
	res.format({
		"text/html": function() {
			data.partials = extend({}, global_partials, data.partials || {});
			res.render(view, data, function(err, html) {
				res.render("template", {
					base_url : base_url,
					content : html
				});
			})
		},
		"application/json": function() {res.json(data)}
	});
}
