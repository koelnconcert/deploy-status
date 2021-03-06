var fs = require('fs');
var moment = require('moment');
var Git = require('git-wrapper');

var repo_base_dir = "repos";
var conf_dir = "config";

var repos = {};

function init() {
	console.log("checking repos...");
	getRepositories();
	module.exports = repos;
}

function getRepositories() {
	fs.readdirSync(conf_dir).forEach(function (name) {
		if (name.match(/^\./))
			return;

		console.log("initalising repo '" + name + "'");

		var repo_dir = repo_base_dir + "/" + name;
		var config_file = fs.readFileSync(conf_dir + "/" + name, "UTF-8");
		var config = JSON.parse(config_file);
		var repo = {
			name : name,
			config : config,
			git : new Git({'git-dir' : repo_dir}),
			is_fetching : false,
		};
		repos[name] = repo;

		repo.refresh = function() { refreshRepo(repo) };
		fetchRepo(repo);
	});
}

function refreshRepo(repo) {
	var updated = moment(repo.updated);
	var now = moment();
	if (now.diff(updated, 'minutes') >= 5)
		fetchRepo(repo);
}

function fetchRepo(repo) {
	if (repo.is_fetching)
		return;
	console.log("fetching '" + repo.name + "'");
	repo.is_fetching = true;
	repo.git.exec("fetch", ["--all", "--prune"], function (err, msg) {
		repo.updated = moment().format();
		console.log("fetched '" + repo.name + "'");
		repo.is_fetching = false;
		getEvents(repo);
	});
}

function getEvents(repo) {
	repo.git.exec("show-ref", ["--dereference"], function(err, msg) {
		var events = [];
		var lines = msg.split("\n");
		for (var i = 0; i < lines.length; i++) {
			var regexp = new RegExp(/^(.*) refs\/(tags|remotes)\/(.*)\/(.+)$/);
		    var groups = lines[i].match(regexp);
		    if (groups != null) {
			    var revision = groups[1];
			    var isTag = groups[2] == "tags";
			    var isBranch = groups[2] == "remotes";
			    var remote = groups[3];
			    var name = groups[4];
			    
			    var config = repo.config.remotes[remote];
			    if (config == undefined)
			    	continue;

			    var tag_filter = new RegExp(config.tags || null);
			    var branch_filter = new RegExp(config.branch || null);
			    
			    var event = {
	    			revision : revision,
	    			remote : remote,
			    } 
			    if (isTag) {
			    	if (name.match(/^deployed-(current|last)$/))
			    		continue;
			    	var groups = name.match(new RegExp("^deployed-([0-9]+_[0-9]+)$"));
			    	if (groups != null) {
			    		event.type = "deployment";
			    		event.date = moment(groups[1]+"+00:00", "YYYYMMDD_HHmmssZZ").utc().format();
			    		events.push(event);
			    	} else if (name.match(tag_filter)) {
			    		event.type = "tag";
			    		event.tag = name;
			    		setCommitDate(repo, event);
			    		events.push(event);
			    	}
			    } else if (isBranch && name.match(branch_filter)) {
			    	event.type = "branch";
			    	event.branch = name;
			    	setCommitDate(repo, event);
			    	events.push(event);
			    }
			    
		    }
		}
		repo.events = events;
	})
}

function setCommitDate(repo, event) {
	// see man gitrevision
	repo.git.exec("show", ["-s", '--format="%ct"', event.revision + "^{}"], function(err, msg) {
		event.date = moment.unix(msg).utc().format();
	});
} 

init();
