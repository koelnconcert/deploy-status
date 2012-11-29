function init() {
	$("input").change(function(event) {
		var input = $(event.target);
		var repo_url = input.data("repo-url");
		var rev1 = input.val();
		var checked = $("input:checked");
		if (checked.size() == 0) {
			$("input").attr('disabled', false);
		} else if (checked.size() == 1) {
			$("input").filter(function(idx, input) {
				var same_repo = $(input).data("repo-url") == repo_url;
				var same_rev = $(input).val() == rev1;
				return !same_repo || same_rev;
			}).not(input).attr('disabled', true);
		} else if (checked.size() == 2) {
			var rev2 = checked.not(input).val();
			var url = repo_url + "/diff/" + rev1 + "/" + rev2;
			checked.attr('checked', false); //clean for back button
			window.location.href=url;
		}
	});
}

$(document).ready(init);