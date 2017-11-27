(function($) {
	function onSelect(e) {
		var el = e.currentTarget;
		var rnd = Math.random()
			.toString()
			.substring(2);

		$(el).before(
			"<input id='tmp-" +
				rnd +
				"' class='" +
				el.getAttribute("class") +
				"' value='" +
				e.originalEvent.text.label +
				"' readonly />"
		);
		$(el).hide();
		var $readonly = $("#tmp-" + rnd);
		$readonly.removeAttr("id");
		$readonly.one("click", function() {
			$readonly.remove();
			el.value = "";
			$(el)
				.show()
				.focus();
		});
	}

	function onPlaceholderClick(e) {
		var $this = $(e.currentTarget);

		var $input = $this.parent().find(".awesomplete-label");

		$this.remove();
		$input.val("");
		$input.show().focus();
	}

	function onRepeatClick(e) {
		var $this = $(e.currentTarget);

		var $before = $this.parent();

		var $template = $this
			.closest(".repeatable")
			.children()
			.first()
			.clone();
		$template.find("input").val("");
		$template.find("textarea").val("");
		$template.find(".awesomplete-label[readonly]").remove();
		$template.find(".awesomplete-label").show();
		$template.find(".listening").removeClass("listening");
		$template.insertBefore($before);

		installListeners();
	}

	function onClickableClick(e) {
		window.location = $(e.currentTarget).attr("data-clickable");
	}

	function labeledAwesomplete(el) {
		if (el.hasAttribute("readonly")) {
			return;
		}

		var list = [],
			values = el.getAttribute("data-value").split(";"),
			labels = el.getAttribute("data-label").split(";"),
			defaultValue = el.getAttribute("value"),
			style = el.getAttribute("style");

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

		$(el)
			.on("awesomplete-select", onSelect)
			.addClass("listening");
	}

	function installListeners() {
		$('[data-toggle="tooltip"]').tooltip();

		var labels = $(
			".awesomplete-label[data-label][data-value][name]:not(.listening)"
		);

		for (var i = 0; i < labels.length; i++) {
			labeledAwesomplete(labels[i]);
		}

		$(".awesomplete-placeholder")
			.off("click", onPlaceholderClick)
			.on("click", onPlaceholderClick);

		$(".repeat a.btn")
			.off("click", onRepeatClick)
			.on("click", onRepeatClick);

		$("[data-clickable]")
			.off("click", onClickableClick)
			.on("click", onClickableClick);
	}

	installListeners();
})(jQuery);
