(function() {
	document.querySelectorAll(".awesomplete-label").forEach(function(el) {
		var list = [],
			values = el.getAttribute("data-value").split(";"),
			labels = el.getAttribute("data-label").split(";");

		if (values.length !== labels.length) {
			console.error("data-value and data-label size don't match for", el);
			return;
		}

		for (var i = 0; i < values.length; i++) {
			list.push({ label: labels[i], value: values[i] });
		}

		new Awesomplete(el, {
			list: list
		});

		el.addEventListener("awesomplete-select", function(e) {
			$(el).before(
				"<input id='tmp' class='" +
					el.getAttribute("class") +
					"' value='" +
					e.text.label +
					"' readonly />"
			);
			$(el).hide();
			var $readonly = $("#tmp");
			console.log($readonly);
			$readonly.removeAttr("id");
			$readonly.on("click", function() {
				$readonly.hide();
				el.value = "";
				$(el)
					.show()
					.focus();
			});
		});
	});
})();
