tmp = function() {
	if (Core.config.model !== "650") {
		return;
	}
	var definitions, loaded;
	loaded = {};
	definitions = {
		Chess: ["Chess.js", "CHESS"],
		Draughts: ["Draughts.js", "DRAUGHTS"],
		FiveBalls: ["FiveBalls.js", "GAME"],
		FiveRow: ["FiveRow.js", "GAME"],
		FreeCell: ["FreeCell.js", "GAME"],
		Mahjong: ["Mahjong.js", "GAME"],
		MineSweeper: ["MineSweeper.js", "GAME"],
		Solitaire: ["Solitaire.js", "GAME"],
		Sudoku: ["Sudoku.js", "GAME", true],
		XOCubed: ["XOCubed.js", "GAME", true]
	};

	var load = function(name) {
		var addon, i, n, action;
		if (!loaded[name]) {
			Core.loadAddon(definitions[name][0], definitions[name][2]);
			loaded[name] = true;
		}
		addon = Core.addonByName[name];
		if (!addon) {
			throw "Lazy game not registered: " + name;
		}
		for (i = 0, n = addon.actions.length; i < n; i++) {
			action = addon.actions[i];
			if (action.name === name) {
				action.action();
				return addon;
			}
		}
		throw "Lazy addon action not found: " + name;
	};

	var add = function(name) {
		var definition = definitions[name];
		Core.addAddon({
			name: name,
			title: name,
			icon: definition[1],
			actions: [{
				name: name,
				group: "Games",
				icon: definition[1],
				action: function() {
					load(name);
				}
			}]
		});
	};

	for (var name in definitions) {
		if (definitions.hasOwnProperty(name)) {
			add(name);
		}
	}
};
try {
	tmp();
	tmp = undefined;
} catch (e) {
	log.error("in LazyGames.js", e);
}
