// Name: Standard Actions for models 300, 505
// Description: Provides built-in actions like "shutdown", "next page" etc
// Author: kartu
//
// History:
//	2010-06-27 kartu - Adapted for 300 from former KeyBindings addon
//	2010-11-28 kartu - 600: Implemented #31 "Use Volume buttons to move through history"
//				300: Fixed "next/prev" page actions consuming "goto page" key events 
//	2011-10-27 Mark Nord - ported bubbleActions from x50
//	2011-10-28 Mark Nord - fixed issue #206

tmp = function() {
	var L, log, NAME, StandardActions, model, book, doHistory, isBookEnabled,
		addBubbleActions, addOptionalActions, doBubble, doBubbleFunc;
	NAME = "StandardActions";
	L = Core.lang.getLocalizer(NAME);
	log = Core.log.getLogger(NAME);

	// Shortcuts
	model = kbook.model;
	book = model.container.sandbox.PAGE_GROUP.sandbox.PAGE;
	isBookEnabled = function() {
		return book.isEnabled();
	}
	
	// Cross-model do history
	//	whereTo - integer, positive moves back
	doHistory = function (whereTo) {
		try {
			if (model.currentBook && model.currentBook.media) {
				if (model.currentBook.media.rememberBy(kbook.bookData, whereTo)) {
					return;
				}
			}		
		} catch (e) {
			log.error("doHistory", e);
		}
		model.doBlink();
	};

	// Generic "bubbling" code, bubbles using currently focused item;
	doBubble = function(cmd, param) {
		var currentNode, focus;
		currentNode = model.current;
		if (currentNode) {
			focus = kbook.model.container.getWindow().focus;
			if (focus) {
				try {
					focus.bubble(cmd, param);
				} catch (e) {
					log.error("in doBubble, command " + cmd, e);
				}
			} else {
				model.doBlink();
			}
		}
	};
	
	doBubbleFunc = function() {
		doBubble(this.bubble);
	};
	
	// Adds "bubblable" actions, if model supports them
	addBubbleActions = function (actions) {
		var bubbles, bubble, icons, i, m, n;
		bubbles = ["doMark",   "doMarkMenu", "doMenu", "doSize",     "doRoot"   ];
		icons   = ["BOOKMARK", "BOOKMARK",   "BACK",   "TEXT_SCALE", "ROOT_MENU"];
		for (i = 0, n = bubbles.length; i < n; i ++) {
			bubble = bubbles[i];
			if (model[bubble]) {
				actions.push( {
					name: "BubbleAction_" + bubble,
					title: L("ACTION_" + bubble),
					group: "Book",
					icon: icons[i],
					bubble: bubble,
					action: doBubbleFunc
				});
			}
		}
		bubbles = undefined;
	};
	
	addOptionalActions = function(actions) {
		if (Core.config.compat.hasVolumeButtons) {
			actions.push({
				name: "NextSong",
				title: L("ACTION_NEXT_SONG"),
				group: "Other",
				icon: "NEXT_SONG",
				action: function () {
					model.doGotoNextSong();
				}
			});
			actions.push({
				name: "PreviousSong",
				title: L("ACTION_PREVIOUS_SONG"),
				group: "Other",
				icon: "PREVIOUS_SONG",
				action: function () {
					model.doGotoPreviousSong();
				}
			});
			
		}
		// FIXME: implicit "is touchscreen device"
		if (Core.config.compat.hasJoypadButtons) {
			actions.push({
				name: "GotoLink",
				title: L("ACTION_GOTO_LINK"),
				group: "Book",
				icon: "NEXT_PAGE",
				action: function () {
					if (isBookEnabled()) {
						book.doCenter();
					} else {
						return true;
					}
				}
			});
		}
	};	
	
	StandardActions = {
		name: NAME,
		title: L("TITLE"),
		icon: "SETTINGS",
		actions: [
			{
				name: "Shutdown",
				title: L("ACTION_SHUTDOWN"),
				group: "Other",
				icon: "SHUTDOWN",
				action: function () {
					model.doDeviceShutdown();
				}
			},
			{
				name: "NextPage",
				title: L("ACTION_NEXT_PAGE"),
				group: "Book",
				icon: "NEXT_PAGE",
				action: function () {
					if (isBookEnabled()) {
						book.doNext();
					} else {
						return true;
					}
				}
			},
			{
				name: "PreviousPage",
				title: L("ACTION_PREVIOUS_PAGE"),
				group: "Book",
				icon: "PREVIOUS_PAGE",
				action: function () {
					if (isBookEnabled()) {
						book.doPrevious();
					} else {
						return true;
					}
				}
			},
			{
				name: "NextInHistory",
				title: L("ACTION_NEXT_IN_HISTORY"),
				group: "Book",
				icon: "NEXT",
				action: function () {
					if (isBookEnabled()) {
						doHistory(-1);
					} else {
						return true;
					}
				}
			},
			{
				name: "PreviousInHistory",
				title: L("ACTION_PREVIOUS_IN_HISTORY"),
				group: "Book",
				icon: "PREVIOUS",
				action: function () {
					if (isBookEnabled()) {
						doHistory(1);
					} else {
						return true;
					}
				}
			},
			{
				name: "ContinueReading",
				title: L("ACTION_CONTINUE_READING"),
				group: "Book",
				icon: "CONTINUE",
				action: function () {
					// Show current book
					kbook.model.onEnterContinue();
				}
			},
			{
				name: "doRotate",
				title: L("ACTION_doRotate"),
				group: "Other",
				icon: 23,
				action: function () {
					ebook.rotate();
				}
			}
		]
	};
	// Optional actions depending on the model  
	try {
		addBubbleActions(StandardActions.actions);
		addOptionalActions(StandardActions.actions);
	} catch (e) {
		log.trace("Failed to add optional/bubble actions " + e);
	}
	Core.addAddon(StandardActions);
};
try {
	tmp();
} catch (e) {
	// Core's log
	log.error("in StandardActions.js", e);
}