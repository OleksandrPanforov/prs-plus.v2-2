// Name: 650 config
// Description: Sony PRS-650 model specific configuration
//
// History:
//	2011-02-07 kartu - Initial version, based on 950
//	2011-02-08 kartu - "More" is now by default attached to the root folder
//	2011-02-27 kartu - Periodicals node no longer "unmovable", replaced with "Browse Folders" by default
//	2011-02-28 kartu -  ALL: Added 
//		Calculator by Mark Nord
//		Chess by Ben Chenoweth / Stefano Gioffre
//		Five in a Row by Ben Chenoweth
//		Five Balls by Clemenseken
//		Free Cell by Ben Chenoweth
//		Mahjong by Clemenseken
//		Sudoku by Obelix
//	2011-06-29 Ben Chenoweth - ALL: Updated existing games/calculator to use AppAssets and added
//		Draughts by Ben Chenoweth
//		MineSweeper by Mark Nord / D. Shep Poor
//		XO-Cubed by Ben Chenoweth
//	2011-07-03 Mark Nord - Added NodeKinds.STANDBY
//	2011-08-03 Ben Chenoweth - ALL: Added
//		Calendar by Ben Chenoweth
//		Solitaire by Ben Chenoweth
//	2011-08-28 Ben Chenoweth - Moved games into Games node
//	2011-09-04 Mark Nord - NodeKinds.getIcon modified to accept "#icon-number" (not consistent across model-border but speeds up testing)
//	2011-09-14 kartu - renamed games & utils into games
//	2011-10-13 quisvir - Fixed #192 Games folder is on the wrong place
//	2011-10-14 Ben Chenoweth - Added home icons for Games node and Calendar
//	2011-10-19 Ben Chenoweth - Added ALT icons; reverted BOOK to 2 and PICTURE to 4
//	2011-10-22 Ben Chenoweth - Fix for assigning default HOME and LARGE icons to items that don't have them.
// 	2011-10-22 Mark Nord - Fix for node "games" in customNodes (instead of "") it's now consitstend for all x50
//	2011-11-13 kartu - changed rootNode to a function, since node is not available at the time config file is loaded
 
return {
	// Menu icon indices 
	NodeKinds: {
		EMPTY: 1000,
		ALL_BOOKS: 1,
		BOOK: 2, // 17
		FILE: 2,
		AUDIO: 3,
		PICTURE: 4,  // 18
		SETTINGS: 5,
		AUTHOR: 6,
		CONTINUE: 7,
		PREVIOUS_PAGE: 8,
		NEXT_PAGE: 9,
		BOOKMARK: 10,
		NOTES: 10,
		LIST: 11,
		BOOK_HISTORY: 1, // 11
		CLOCK: 12,
		PAUSE: 13,
		PLAY: 14,
		INFO: 15,
		LOCK: 16,
		BOOKS: 17,
		PICTURES: 18,
		CROSSED_BOX: 19,
		DATE: 22,
		LANDSCAPE: 24,
		ABOUT: 25,
		BACK: 26,
		ABC: 27,
		DATETIME: 28,
		DB: 29,
		SHUTDOWN: 31,
		COLOR: 32,
		TEXT_SCALE: 99, //39
		GESTURE: 38,
		SEARCH: 39,
		NODICTIONARY: 40,
		KEYBOARD: 51,
		ROOT_MENU: 53,
		INTERNAL_MEM: 54,
		MS: 55,
		SD: 56,
		LANGUAGE: 57,
		NEW: 61,
		TIMEZONE: 62,
		PERIODICALS: 67,
		HOME: 26, // missing
		
		STANDBY: 79,
		
		UNCHECKED: 85,
		CHECKED: 86,
		
		FOLDER: 87,
		GAME: 88,
		CALC: 89,
		//WORLD: 90,
		//KEYBOARD: 91,
		CHESS: 92,
		CARDS: 93,
		SUDOKU: 94,
		MAHJONG: 95,
		FIVEROW: 96,
		FIVEBALLS: 97,
		DRAUGHTS: 98,
		BOMB: 100,
		
		FONT: 101,
		APPLICATIONS: 102,
		EXECUTABLE: 103,
		PREVIOUS_SONG: 104,
		NEXT_SONG: 105,
		PREVIOUS: 106,
		NEXT: 107,
		ARCHIVE: 108,
		BRIGHT_CONT: 109,
		BRIGHTNESS: 110,
		CONTRAST: 111,
		
		BOOK_ALT: 112,
		PICTURE_ALT: 113,
		SEARCH_ALT: 114,
		
		DEFAULT: 87,
		
		// big icons shonw in home menu
		LARGE_BOOK_HISTORY: 2,
		LARGE_FOLDER: 4,
		LARGE_MORE: 5,
		LARGE_GAME: 6,
		LARGE_DATE: 7,
		
		// At least 600 and 900 have more than one type of icons
		getIcon: function (strKind, type) {
			try{
				var kind, i;
				if (type === "home") {
					kind = this["HOME_" + strKind];
					if (typeof kind === "undefined") {
						kind = this.HOME_FOLDER;
					}
				} else if (type === "homeLarge") {
					kind = this["LARGE_" + strKind];
					if (typeof kind === "undefined") {
						kind = this.LARGE_FOLDER;
					}				
				} else {
					i = strKind.lastIndexOf("#");
					if (i > -1) {
						kind = parseInt(strKind.substring(i+1));
					} else {
						kind = this[strKind];
					}
				}
				if (typeof kind === "undefined") {
					kind = this.FOLDER;
				}
				return kind;
			}
			catch (e) {
				return this.FOLDER;
			}
		}
	},
	
	// PRS+ abstract key code to actual key code, model specific
	keyCodes: {
		volume_down: "kVolumeMinus", 
		volume_down_h: "kVolumeMinus-hold", 
		volume_up: "kVolumePlus",
		volume_up_h: "kVolumePlus-hold",
		home: "kHome",
		home_h: "kHome-hold",
		size: "kSize",
		size_h: "kSize-hold",
		option: "kOption",
		option_h: "kOption-hold"
	},
	// does device have numeric keys
	hasNumericButtons: false,
	// are there volume keys
	hasVolumeButtons: true,
	// are there paging buttons
	hasPagingButtons: false,
	// are there joypad buttons
	hasJoypadButtons: false,
	// are there "other" buttons
	hasOtherButtons: true,
	// Are there SD/MS card slots
	hasCardSlots: true,
	
	// Where to find which node, relative to kbook.root
	standardMenuLayout: {
		"continue": [0, 0],
		books: [0, 1],
		periodicals: [0, 2],
		collections: [0, 3],
		notes: [0, 4],
		//newdelivery: [0, 5],
		//textMemo: [2, 3],
		//handwriting: [2, 2],
		//audio: [2, 0],
		//pictures: [2, 1],
		apps: [1],
		settings: [2]
	},
	
	// Root node for menu customizer
	rootNode: function() { return kbook.root.nodes[0] },
	
	// Menu configuration
	prspMenu: {
		// Container nodes
		customContainers: [
			{ name: "more", title: "NODE_MORE", icon: "MORE", parent: "root"},
			{ name: "games", title: "NODE_GAMES", shortName: "Games", icon: "GAME"}
		],
		// Nodes assigned to certain nodes
		customNodes: [
			{ name: "PRSPSettings", parent: "settings", position: 0},
			{ name: "collections", parent: "more" },
			{ name: "periodicals", parent: "more" },
			{ name: "notes", parent: "more" },
			{ name: "games", parent: "more" },
			{ name: "Calculator", parent: "more" },
			{ name: "Calendar", parent: "more" },	
			{ name: "Chess", parent: "games" },
			{ name: "Draughts", parent: "games" },
			{ name: "FiveBalls", parent: "games" },	
			{ name: "FiveRow", parent: "games" },	
			{ name: "FreeCell", parent: "games" },
			{ name: "Mahjong", parent: "games" },
			{ name: "MineSweeper", parent: "games" },
			{ name: "Solitaire", parent: "games" },
			{ name: "Sudoku", parent: "games" },
			{ name: "XOCubed", parent: "games" }
		],
		movableNodes: [0, 0, 1, 1, 1],
		defaultLayout: [
			{ name: "continue"},
			{ name: "books"},
			{ name: "BrowseFolders"},
			{ name: "BookHistory"},
			{ name: "more" }
		]		
	},

	media: {
		// types to be used to determine media type using "xs.isInstanceOf"
		types: [ FskCache.text  , FskCache.image, FskCache.notepad],
		// what kind it is, supported are: "book", "picture", "note", "audio"
		kinds: [ "book", "picture", "note"],
		// node prototypes to use when creating media nodes
		prototypes: [ FskCache.tree.bookNode, kbook.root.children.applicationRoot.children.pictures.prototype, FskCache.tree.notepadFreehandNode]
	}, 

	
	compareStrings: function(a, b) {
		if (a === b) {
			return 0;
		}
		return a > b ? 1 : -1;
	}
};