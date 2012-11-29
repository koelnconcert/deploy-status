function init() {
	addDiffButtons();
	colorizeLogs();
	colorizeDiff();
}

function addDiffButtons() {
	$("input").change(function(event) {
		var input = $(event.target);
		var repo = input.data("repo");
		var rev1 = input.val();
		var checked = $("input:checked");
		if (checked.size() == 0) {
			$("input").attr('disabled', false);
		} else if (checked.size() == 1) {
			$("input").filter(function(idx, input) {
				var same_repo = $(input).data("repo") == repo;
				var same_rev = $(input).val() == rev1;
				return !same_repo || same_rev;
			}).not(input).attr('disabled', true);
		} else if (checked.size() == 2) {
			var rev2 = checked.not(input).val();
			var url = "repo/" + repo + "/diff/" + rev1 + "/" + rev2;
			checked.attr('checked', false); //clean for back button
			window.location.href=url;
		}
	});
}

function colorizeLogs() {
	$(".log").each(function(idx, elem) {
		var log = $(elem);
		var rev1 = log.data("rev1").substr(0,7);
		var rev2 = log.data("rev2").substr(0,7);
		replaceHtml(log, rev1, '<span class="rev1">' + rev1 + '</span>');
		replaceHtml(log, rev2, '<span class="rev2">' + rev2 + '</span>');
	})
}

function replaceHtml(elem, search, newvalue) {
	elem.html(elem.html().replace(search, newvalue));
}

function colorizeDiff() {
	$(".diff").each(function(idx, elem) {
		var diff = $(elem);
		replaceHtml(diff, /\n(---|\+\+\+) .*?(?=\n)/g, "");
		replaceHtml(diff, /^diff --git a\/(.*) b\/.*/mg, "<h4>$1</h4>");
		replaceHtml(diff, /\nindex .*?\n/g, "");
		replaceHtml(diff, /(^\+.*)/mg, "<span class='addline'>$1</span>");
		replaceHtml(diff, /(^-.*)/mg, "<span class='delline'>$1</span>");
		replaceHtml(diff, /^(@@.*@@)/mg, "<span class='lines'>$1</span>");
	});
}

$(document).ready(init);
