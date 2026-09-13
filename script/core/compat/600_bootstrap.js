// Name: 600
// Description: Sony PRS-600 bootstrap code
//	Receives PARAMS argument with the following fields:
//		bootLog, Core, loadAddons, loadCore
//	Must call loadAddons, loadCore and Core.init at appropriate times
//
// Credits:
//	Keyboard popup chars code discovered and harnessed by Mark Nord
//
// History:
//	2010-09-02 kartu - Initial version
//	2010-11-29 kartu - Added Georgian (by rawerfas) Italian #29 (by Salvatore Ingala) and Chinese #26 (by frank0734) translations
//	2010-11-30 kartu - Fixed #14 " * by author/title sorting doesn't work for non latin chars"
//	2010-12-01 kartu - Fixed #28 "Stand-by image should be independent of screen orientation" 
//			(added landscape subfolder support, as there is no way to rotate the image
//	2011-02-06 kartu - Fixed #64 "Wrong german translation file"
//	2011-02-27 kartu - Added Belorussian / Ukranian chars (as popups) to keyboard
//	2011-02-27 kartu - Refactored parameters into PARAMS object
//	2011-03-02 kartu - Added #47&48 Spanish (by ?)  & Catalan (by Alex Castrillo) localizations
//	2011-03-19 kartu - Fixed keyboard: "aaaa" is shown instead of ascented (popup) letters
//	2011-03-24 kartu - Added Portuguese localization by OTNeto
//	2011-04-01 kartu - Renamed language files to corresponding 2 letter ISO codes
//	2011-04-21 kartu - Added option to disable scanning without loading cache
//	2011-07-04 Mark Nord - Added #24 "Displaying first page of the book on standby" based on code found by Ben Chenoweth
//	2011-07-05 Ben Chenoweth - Minor fix to prevent crash when showing actual page on standby
//	2011-08-18 Mark Nord - fixed current page as StandbyImage + display of localised "sleeping.." instead of the clock
//	2011-08-27 Ben Chenoweth - Minor fix to 'Sleeping...' text location
//	2011-10-09 Ben Chenoweth - Applied quisvir's code to always show book covers in portrait mode and keep aspect ratio;
//			"Sleeping..." for landscape-mode by making coordinates dynamic; also show wallpaper in portrait-mode
//			so no need for /landscape/ subfolder.
//	2011-10-10 Ben Chenoweth - Fix for cover/wallpaper on standby.
//	2011-10-11 Ben Chenoweth - Further fix for cover/wallpaper on standby & code tidying.
//	2011-11-04 kartu - Added Turkish
//	2011-11-14 kartu - Fixed #207 Collection sorting is broken for cyrillic
//	2011-12-30 quisvir - Added scaling option due to popular demand
//
//-----------------------------------------------------------------------------------------------------
// Localization related code is model specific.  
// Replacing default  "choose language" menu & "choose keyboard" menu
//-----------------------------------------------------------------------------------------------------

var tmp = function() {
	var localize, localizeKeyboard, localizeKeyboardPopups, oldSetLocale, oldChangeKeyboardType, oldReadPreference, 
		getRandomWallpaper, wallpapers, landscapeWallpapers, oldCallback;
	localize = function(Core) {
		try {
			var i, n, currentLang, settingsNode, langNode, languages, langNames, enter, 
				node, langFile;
			currentLang = kbook.model.language;
			settingsNode = kbook.root.nodes[6].nodes[2];
			languages = ["ca", "cs", "en", "es", "de", "fr", "it", "nl", "ka", "pt", "ru", "tr", "zh"];
			langNames = {
				ca: "Català",
				cs: "Český",
				en: "English",
				es: "Español",
				de: "Deutsch", 
				fr: "Français", 
				it: "Italiano",
				ka: "ქართული",
				nl: "Nederlands",
				pt: "Português",
				ru: "Русский",
				tr: "Türkçe",
				zh: "简体中文 (Simplified Chinese)"
			};
	
			// Load core js		
			PARAMS.loadCore();
			
			// Load PRS+ strings
			langFile = Core.config.corePath + "lang/" + currentLang + ".js";
			Core.lang.init(langFile);
			
			// FIXME localize date strings
			for (i = 0, n = languages.length; i < n; i++) {
				if (!Date.prototype.strings[languages[i]]) {
					Date.prototype.strings[languages[i]] = xs.newInstanceOf(Date.prototype.strings.en);
					Number.prototype.strings[languages[i]] = xs.newInstanceOf(Number.prototype.strings.en);
				}
			}
	
			// Custom language node
			langNode = Core.ui.createContainerNode({
				title: "fskin:/l/strings/STR_NODE_TITLE_LANG_SETTINGS".idToString(),
				icon: "LANGUAGE",
				comment: function() {
					return langNames[kbook.model.language];
				},
				parent: settingsNode
			});
			
			// Enter function for language children, changes locale and moves to parent
			enter = function() {
				try {
					// Code from kbook.xsb
					Fskin.localize.setLocale({language: this.tag, region: "XX"});
					kbook.model.language = this.tag;
					kbook.model.clearTitleSorters();
					kbook.root.update(kbook.model);
					kbook.model.writeFilePreference();
					this.parent.gotoParent(kbook.model);
					Core.ui.showMsg(Core.lang.L("MSG_RESTART"));					
				} catch (e) {
					PARAMS.bootLog("changing language", e);
				}
			};
			
			// Create language node's children
			for (i = 0, n = languages.length; i < n; i++) {
				node = Core.ui.createContainerNode({
						title: langNames[languages[i]],
						icon: "CROSSED_BOX",
						parent: langNode
				});
				node.tag = languages[i];
				node.enter = enter;
				if (currentLang === languages[i]) {
					node.selected = true;
				}
				langNode.nodes.push(node);
			}
			
			// Replace "language" node with custom node
			settingsNode.nodes[5]= langNode;
			localizeKeyboard(Core);
			
			// self destruct :)
			localize = null;
		} catch (e) {
			PARAMS.bootLog("localize", e);
		}
	};
	
	// Init language related stuff once setLocale was called and strings were loaded
	oldSetLocale = Fskin.localize.setLocale;
	Fskin.localize.setLocale = function() {
		try {
			oldSetLocale.apply(this, arguments);
			// restore "old" set locale
			Fskin.localize.setLocale = oldSetLocale;
			
			localize(PARAMS.Core);
		} catch (e) {
			PARAMS.bootLog("in overriden setLocale", e);
		}
	};
	
	// Keyboard related stuff
	localizeKeyboard = function (Core) {
		var i, n, node, advancedSettingsNode, keyboardNode, keyboardTypes, keyboardNames, enter;
		keyboardTypes = [
				"Czech",
				"French-France",
				"German-Germany", 
				"Georgian", 
				"Dutch-Netherlands", 
				"Russian",
				"English-UK", 
				"English-US" 
		];
		keyboardNames = {
			"Czech": "Český",
			"French-France": "Français",
			"German-Germany": "Deutsch",
			"Georgian": "ქართული",
			"Dutch-Netherlands": "Nederlands",
			"Russian": "Русская",
			"English-UK": "United Kingdom",
			"English-US": "United States"
		};
		advancedSettingsNode = kbook.root.nodes[6].nodes[2].nodes[6];
	
		
		// Enter function for keyboard children, changes keyboard and moves to parent
		enter = function() {
			try {
				kbook.model.keyboard = this.tag;
				kbook.model.writeFilePreference();
				this.parent.gotoParent(kbook.model);			
			} catch (e) {
				PARAMS.bootLog("changing keyboard", e);
			}
		};	
		
		// Custom language node
		keyboardNode = Core.ui.createContainerNode({
			title: "fskin:/l/strings/STR_UI_NODE_TITLE_KEYBOARD".idToString(),
			icon: "KEYBOARD",
			comment: function() {
				return keyboardNames[kbook.model.keyboard];
			},
			parent: advancedSettingsNode
		});
		
		// Create language node's children
		for (i = 0, n = keyboardTypes.length; i < n; i++) {
			node = Core.ui.createContainerNode({
					title: keyboardNames[keyboardTypes[i]],
					icon: "CROSSED_BOX",
					parent: keyboardNode
			});
			node.tag = keyboardTypes[i];
			node.enter = enter;
			keyboardNode.nodes.push(node);
		}	
		
		advancedSettingsNode.nodes[2] = keyboardNode;
	
		// self destruct :)	
		localizeKeyboard = null;
	};
	
	oldChangeKeyboardType = Fskin.kbookKeyboard.keyboardLayout.changeKeyboardType;
	Fskin.kbookKeyboard.keyboardLayout.changeKeyboardType = function (langType) {
		var url, path, keyboardPaths;
		try {
			keyboardPaths = {
				"English-US": "KeyboardLayout103P.xml",
				"English-UK": "KeyboardLayout166.xml",
				"French-France": "KeyboardLayout189.xml",
				"German-Germany": "KeyboardLayout129.xml",
				"Dutch-Netherlands": "KeyboardLayout143.xml",
				"Russian": "languages/KeyboardLayoutRussian.xml",
				"Georgian": "languages/KeyboardLayoutGeorgian.xml",
				"Czech": "languages/KeyboardLayoutCzech.xml"
			};
			path = System.applyEnvironment('[keyboardLayoutPath]') ;
			url = 'file://' + path + keyboardPaths[langType] ;
			this.layoutData = null;
			this.setURI(url);
		} catch (e) {
			// call the default version
			oldChangeKeyboardType.apply(this, arguments);
		}
	};
	
	// Init core here
	oldReadPreference = kbook.model.readPreference;
	kbook.model.readPreference = function() {
		try {
			oldReadPreference.apply(this, arguments);
			// restore "old" readPreference
			kbook.model.readPreference = oldReadPreference;
			
			PARAMS.loadAddons();
			PARAMS.Core.init();
	
			// Fix home icons of "All Notes" &  "Collections"
			PARAMS.Core.ui.nodes.collections.homekind = PARAMS.Core.config.compat.NodeKinds.HOME_COLLECTIONS;
			PARAMS.Core.ui.nodes.notes.homekind = PARAMS.Core.config.compat.NodeKinds.HOME_NOTES;
			
			// Fix large icons in home menu
			// bottom right icon
			if (kbook.root.nodes[2].hasOwnProperty("homelargekind")) {
				Fskin.kbookMenuHome.homeMenu.vertical.items[3].kind = kbook.root.nodes[2].homelargekind;
			}
			// bottom left icon
			if (kbook.root.nodes[3].hasOwnProperty("homelargekind")) {
				Fskin.kbookMenuHome.homeMenu.vertical.items[2].kind = kbook.root.nodes[3].homelargekind;
			}
			
			// FIXME proper fix is including glyphs into fonts
			// Fix missing arrows #42 in page turn gesture comment
			kbook.root.nodes[6].nodes[2].nodes[3]._mycomment = function() {
				return kbook.model.gestureDirectionFlag ? "<--" : "-->";
			};
		} catch (e) {
			PARAMS.bootLog("in overriden readPreference " + e);
		}
	};
	
	// Disable card scan
	var originalCanHandleVolume = FskCache.diskSupport.canHandleVolume;
	FskCache.diskSupport.canHandleVolume = function (volume) {
		try {
			if (PARAMS.Core && PARAMS.Core.config && PARAMS.Core.config.cardScanMode === "disabled") {
				return false;
			}
		} catch (ee) {
			bootLog("canHandleVolume" + ee);
		}
		return originalCanHandleVolume.apply(this, arguments);
	};	
	
	// Disabling scanning, but loading cache
	oldCallback = FskCache._diskSource.synchronizeCallback;
	FskCache._diskSource.synchronizeCallback = function() {
		try {
			if (PARAMS.Core && PARAMS.Core.config
				&& PARAMS.Core.config.cardScanMode === "disabledLoadCache") {
				this.target.synchronizedSource();
				this.target.synchronizeDone();
				this.stack.pop();
			} else {
				oldCallback.apply(this, arguments);
			}
		} catch (e) {
			PARAMS.bootLog("Error in callback: " + e);
			oldCallback.apply(this, arguments);
		}
	};
	
	getRandomWallpaper = function() {
		var  path, folder, idx, list;
		try {
			folder = System.applyEnvironment("[prspPublicPath]wallpaper/");
			if (!wallpapers) {
				wallpapers = PARAMS.Core.io.listFiles(folder, ".jpg", ".jpeg", ".gif", ".png"); 
			}
			list = wallpapers;

			while (list.length > 0) {
				idx = Math.floor(Math.random() * list.length);
				path = list[idx];
				if (PARAMS.Core.media.isImage(path)) {
					return folder + path;
				} else {
					list.splice(idx, 1);
				}
			}
		} catch (e) {
			PARAMS.bootLog("error in random image " + e);
		}
	};

	// Standby image
	standbyImage.draw = function() {
		var window, path, bitmap, x, y, bounds, ratio, width, height, ditheredBitmap, color;
		var mode, dither;
		window = this.root.window;
		mode = Core.addonByName.StandbyImage.options.mode;
		dither = Core.addonByName.StandbyImage.options.dither === "true";
		try {
      			if (mode === 'cover') {
					// attempt to use current book cover
					path = kbook.model.currentBook.media.source.path + kbook.model.currentBook.media.path;
					bitmap = BookUtil.thumbnail.createFileThumbnail(path, this.width, this.height);
				}
				if (!bitmap && ((mode === 'random') || (mode === 'cover'))) {
					// if no book cover, then use random wallpaper
					path = getRandomWallpaper();
					if (FileSystem.getFileInfo(path)) {
						bitmap = new Bitmap(path);
					}
				}
				if (bitmap) {
					// if bitmap, then display it preserving aspect ratio
					window.setPenColor(Color.white);
					window.fillRectangle(0, 0, this.width, this.height);
					x = 0;
					y = 0;
					switch (Core.addonByName.StandbyImage.options.ScalingMethod) {
						case 'keepaspect':
							bounds = bitmap.getBounds();
							ratio = (bounds.height/bounds.width > this.height/this.width)?(this.height / bounds.height):(this.width / bounds.width);
							width = Math.floor(bounds.width * ratio);
							height = Math.floor(bounds.height * ratio);
							if (height > width) x = Math.floor((this.width - width) / 2);
							else y = Math.floor((this.height - height) / 2);
							break;
						case 'stretch':
							width = this.width;
							height = this.height;
					}
					ditheredBitmap = bitmap.dither(dither);
					bitmap.close();
					if (ditheredBitmap) {
						window.drawBitmap(ditheredBitmap, x, y, width, height);
						ditheredBitmap.close();
						return;
					}
				}					
       		} catch (e) {PARAMS.bootLog("Exception in cover/random " + e, 'error'); }

		if (mode !=='act_page') {
			try {			
				color = window.getPenColor();
				window.setPenColor(this.color);
				window.fillRectangle(this);
				window.setPenColor(color);
			} catch (e) {PARAMS.bootLog("Exception in blank " + e, 'error'); }        			
		}
		if (mode === 'act_page') {
			L = Core.lang.getLocalizer("StandbyImage");
			// Save old styles
			oldTextStyle = window.getTextStyle();
			oldTextSize = window.getTextSize();
			oldPenColor = window.getPenColor();
			// Settings
			window.setTextStyle("bold");
			window.setTextSize(22);
			// Drawing
			window.beginDrawing();
			window.setPenColor(Color.black);
			window.fillRectangle(this.width-155, this.height-30, 155, 30);
			window.setPenColor(Color.white);
			window.drawText(L("VALUE_SLEEPING"), this.width-145, this.height-30, 135, 30);
			window.endDrawing();
			// Restore pen color, text size & style
			window.setTextStyle(oldTextStyle);
			window.setTextSize(oldTextSize);
			window.setPenColor(oldPenColor);
			}	
	};
	
	// Set orientation to portrait before showing book cover
	var oldSuspend = kbook.model.suspend;
	kbook.model.suspend = function () {
		oldSuspend.apply(this, arguments);
		if (Core.addonByName.StandbyImage.options.mode == 'cover' || Core.addonByName.StandbyImage.options.mode === 'random') orgOrientation = ebook.device.framebuffer.orientation.getCurrent();
		if (orgOrientation !== 0) ebook.device.framebuffer.orientation.setCurrent(0);
	};
	
	// Restore orientation if necessary
	var oldResume = kbook.model.resume;
	kbook.model.resume = function () {
		if (orgOrientation !== 0) ebook.device.framebuffer.orientation.setCurrent(orgOrientation);
		orgOrientation = 0;
		oldResume.apply(this, arguments);
	};

	// Fix sorting (unicode order)
	var compareStrings = PARAMS.Core.config.compat.compareStrings;
	String.prototype.localeCompare = function(a) {
		return compareStrings(this.valueOf(), a);
	};
	
	// Localize "popup" keyboard, that shows after holding button for a couple of secs
	localizeKeyboardPopups = function() {
		var keyboardLayout, oldIsSelectChar, oldSetPopupChar, SEL_CHARS;
		
		keyboardLayout = Fskin.kbookKeyboard.keyboardLayout;
		oldIsSelectChar =  keyboardLayout.isSelectChar;
		oldSetPopupChar = keyboardLayout.setPopupChar;
		
		SEL_CHARS = {
			"и": ["и", "і", "ї"], 
			"у": ["у", "ў"], 
			"е": ["е", "ё", "е", "є"], 
			"г": ["г", "ґ"], 
			"ъ": ["ъ", "'"],
			"И": ["И", "І", "Ї"], 
			"У": ["У", "Ў"], 
			"Е": ["Е", "Ё", "Е", "Є"], 
			"Г": ["Г", "Ґ"], 
			"Ъ": ["Ъ", "'"]		
		};
		
		keyboardLayout.isSelectChar = function(key) {
			if (SEL_CHARS[key] !== undefined) {
				return true;
			}
			return oldIsSelectChar.apply(this, arguments);
		};
		
		keyboardLayout.setPopupChar = function (text, popup) {
			var chars, i, n;
			chars = SEL_CHARS[text];
			if (chars !== undefined) {
				n = chars.length;
				for (i = 0; i < 8; i++) {
					popup["addkey" + i].setText(i < n ? chars[i] : "");
				}
				return n;
			}
			return oldSetPopupChar.apply(this, arguments);
		};
	};
	localizeKeyboardPopups();

	// Add Cyrilic support
	var patchStringCompare = function () {
		var origToUpperCase, origToLowerCase, origLocaleCompare, isCyr;
		origLocaleCompare = String.prototype.localeCompare;
		origToUpperCase = String.prototype.toUpperCase;
		origToLowerCase = String.prototype.toLowerCase;

		isCyr = function (code) {
			return code >= 1040 && code <= 1103;
		};
		
		// Ignoring the case of mixed latin/cyr strings
		String.prototype.localeCompare = function (a) {
			var i, n, code, codeA, cyr, cyrA, ch, chA;
			if (a === null) {
				return (1);
			}

			if (this.length > 0 && a.length > 0) {
				code = this.charCodeAt(0);
				codeA = a.charCodeAt(0);
				cyr = isCyr(code);
				cyrA = isCyr(codeA);

				// Neither is cyrillic
				if (!cyr && !cyrA) {
					return origLocaleCompare.call(this, a);
				}

				// Both are cyrillic
				if (cyr && cyrA) {
					for (i = 0, n = Math.min (this.length, a.length); i < n; i++) {
						ch = this.charAt(i).toLowerCase();
						chA = a.charAt(i).toLowerCase();
						code = this.charCodeAt(i);
						codeA = a.charCodeAt(i);
						
						
						if (ch === chA) {
							// Same char, but different case
							if (code !== codeA) {
								return code > codeA ? -1 : 1;
							}
						} else {
							return ch.charCodeAt(0) > chA.charCodeAt(0) ? 1 : -1;
						}
					}
				} else {
					// one is cyrillic, one not
					return code > codeA ? 1 : -1; 
				}
			}
			
			if (a.length === this.length) {
				return 0;
			}
			
			return this.length  > a.length ? 1 : -1;
		};
		
		String.prototype.toUpperCase = function () {
			var i, n, code, ch, upCh, result;
			result = "";
			for (i = 0, n = this.length; i < n; i++) {
				code = this.charCodeAt(i);
				ch = this.charAt(i);
				if (!isCyr(code)) {
					upCh = origToUpperCase.call(ch);
				} else {
					if (code === 1105) {
						upCh = "Ё";
					} else if (code > 1071) {
						upCh = String.fromCharCode(code - 32);
					} else {
						upCh = ch;
					}
				}
				result += upCh;
			}
			return result;
		};

		String.prototype.toLowerCase = function () {
			var i, n, code, ch, loCh, result;
			result = "";
			for (i = 0, n = this.length; i < n; i++) {
				code = this.charCodeAt(i);
				ch = this.charAt(i);
				if (!isCyr(code)) {
					loCh = origToLowerCase.call(ch);
				} else {
					if (code === 1025) {
						loCh = "ё";
					} else if (code < 1072) {
						loCh = String.fromCharCode(code + 32);
					} else {
						loCh = ch;
					}
				}
				result += loCh;
			}
			return result;
		};
	};

	patchStringCompare();	
};

try {
	tmp();
} catch (ignore) {
}
