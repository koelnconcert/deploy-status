function init() {
	$("input").change(function(event) {
		var input = $(event.target);
		var repo_url = input.data("repo-url");
		var rev1 = input.val();
		var checked = $("input:checked");
		if (checked.size() == 2) {
			var rev2 = checked.not(input).val();
			var url = repo_url + "/diff/" + rev1 + "/" + rev2;
			window.location.href=url;
		}
	});
}

$(document).ready(init);