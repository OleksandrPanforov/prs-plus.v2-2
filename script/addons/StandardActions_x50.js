// Name: Standard Actions for models 350, 600, 650, 950
// Description: Provides built-in actions like "shutdown", "next page" etc
// Author: kartu
//
// History:
//	2010-06-27 kartu - Adapted for 300 from former KeyBindings addon
//	2010-11-28 kartu - 600: Implemented #31 "Use Volume buttons to move through history"
//				300: Fixed "next/prev" page actions consuming "goto page" key events
//	2010-02-05 kartu - Changed direct function calls with "bubbles" for x50
//	2011-02-10 kartu - Implemented # goto TOC, doOption, doSearch, doRotate, doMenu, doSize, doRoot actions
//	2011-02-27 kartu - x50: Added rotate by 0 / 90 / 180 / 270 / clock wise / counter clock wize actions
//	2011-02-27 kartu - 600: Added rotate by 90 action
//	2011-10-27 Mark Nord - Added doPowerSwitch = Sleepmode
//  2011-10-30 Ben Chenoweth - Added goZoomPage

tmp = function() {
	var L, log, NAME, StandardActions, model, book, doHistory, isBookEnabled, 
		addBubbleActions, addOptionalActions, doBubble, doBubbleFunc;
	NAME = "StandardActions";
	L = Core.lang.getLocalizer(NAME);
	log = Core.log.getLogger(NAME);

	// Shortcuts
	model = kbook.model;
	
	// Fixme implicit model sniffing
	if (model.container.sandbox.PAGE_GROUP.sandbox.PAGE_SUBGROUP) {
		book = model.container.sandbox.PAGE_GROUP.sandbox.PAGE_SUBGROUP.sandbox.PAGE;
	} else {
		book = model.container.sandbox.PAGE_GROUP.sandbox.PAGE;
	}
	
	isBookEnabled = function() {
		return book.isEnabled();
	};
	
	// Generic "bubbling" code, bubbles using currently focused item;
	doBubble = function(cmd, param) {
		var currentNode, focus;
		currentNode = model.currentNode;
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
		bubbles = ["doOption", "doSearch", "doRotate", "doMenu", "doSize"    , "doRoot"   ];
		icons   = ["EMPTY"   , "SEARCH"  , "EMPTY"   , "BACK" ,  "TEXT_SCALE", "ROOT_MENU"];
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
		
		// doRotate for x50
		if (kbook.model.onEnterOrientation) {
			var rotateFuncX50 = function() {
				var orientation = kbook.model.container.getVariable("ORIENTATION");
				if (this.closeCurrentOverlay) {
					this.closeCurrentOverlay();
				}
				switch (this.bubble) {
					case 0:
					case 1:
					case 2:
					case 3:
						if (orientation === this.bubble) {
							orientation = 0;
						} else {
							orientation = this.bubble;
						}
						break;
					case -1:
						// clock wise
						orientation -= 1;
						if (orientation < 0) {
							orientation = 3;
						}
						break;
					case -2:
						// counter clock wise
						orientation += 1;
						if (orientation > 3) {
							orientation = 0;
						}
						break;
				}
				doBubble("doRotate", orientation);
			};
			
			// FIXME model sniffing, there must be a better way
			// On 600 only rotate by 90 is possible
			if (Core.config.model === "600") {
				m = 1;
				n = 2;
			} else {
				m = -2;
				n = 4;
			}
			
			for (i = m; i < n; i++) {
				if (i >= 0) {
					bubble = "doRotate" + 90 * i;
				} else if (i === -2) {
					bubble = "doRotateCCWise";
				} else {
					bubble = "doRotateCWise";
				}
				actions.push( {
					name: "BubbleAction_" + bubble,
					title: L("ACTION_" + bubble),
					group: "Other",
					bubble: i, 
					action: rotateFuncX50
				});
			}
		}
	};
	
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
	
	addOptionalActions = function(actions) {
		var gotoTOCFunc, gotoMyNotes;
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
						book.bubble("doCenter");
					} else {
						return true;
					}
				}
			});
		}

		// Goto TOC function
		if (kbook.bookOptionRoot) {
			// models with touch screen
			gotoTOCFunc = function() {
				var toc;
				toc = kbook.bookOptionRoot.contents;
				if  (toc) {
					kbook.model.gotoBookOptionList (toc);
				} else {
					model.doBlink();
				}
			};
		} else {
			// older models
			gotoTOCFunc = function() {
				// FIXME implement
				model.doBlink();
			};
		}
		actions.push({
			name: "OpenTOC",
			title: L("ACTION_OPEN_TOC"),
			group: "Book",
			icon: "LIST",
			action: gotoTOCFunc
		});
		
		if (kbook.bookOptionRoot) {
			gotoMyNotes = function() {
				var notes;
				notes = kbook.bookOptionRoot.notes;
				if (notes) {
					kbook.model.gotoBookOptionList(notes);
				} else {
					model.doBlink();
				}
			};
		} else {
			gotoMyNotes = function() {
				model.doBlink();
			};
		}
		actions.push({
			name: "OpenNotes",
			title: L("ACTION_OPEN_NOTES_LIST"),
			group: "Book",
			icon: "NOTES",
			action: gotoMyNotes
		});
		
		// Zoom page function
		goZoomPage = function() {
			if (kbook.model.doSize) {
			   pageSizeOverlayModel.openCurrentOverlay();
			   pageSizeOverlayModel.goZoomMode();
			} else {
				model.doBlink;
			}
		};
		actions.push({
			name: "ZoomPage",
			title: L("ACTION_ZOOM_PAGE"),
			group: "Book",
			icon: "SEARCH_ALT",
			action: goZoomPage
		});
	};

	StandardActions = {
		name: NAME,
		title: L("TITLE"),
		icon: "SETTINGS",
		// FIXME: check if more actions could be "bublized" 
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
				bubble: "doNext",
				action: doBubbleFunc				
			},
			{
				name: "PreviousPage",
				title: L("ACTION_PREVIOUS_PAGE"),
				group: "Book",
				icon: "PREVIOUS_PAGE",
				bubble: "doPrevious",
				action: doBubbleFunc
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
				name: "Standby",
				title: L("ACTION_STANDBY"),
				group: "Other",
				icon: "STANDBY",
				bubble: "doPowerSwitch",
				action: doBubbleFunc
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