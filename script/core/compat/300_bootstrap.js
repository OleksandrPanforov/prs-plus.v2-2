// Name: 300
// Description: Sony PRS-300 bootstrap code
//	Receives PARAMS argument with the following fields:
//		bootLog, Core, loadAddons, loadCore
//	Must call loadAddons, loadCore and Core.init at appropriate times
//
// History:
//	2010-09-02 kartu - Initial version
//	2010-09-07 kartu - Added Italian translation by Samhain
//	2010-11-27 kartu - Added Georgian translation by raverfas
//	2010-11-28 kartu - First digit is ignored, if it is zero, when opening "goto" dialog
//	2010-11-29 kartu - Renamed ga => ka
//	2010-11-30 kartu - Fixed #14 " * by author/title sorting doesn't work for non latin chars"
//	2011-02-06 kartu - Fixed #64 "Wrong german translation file"
//	2011-02-27 kartu - Refactored parameters into PARAMS object
//	2011-03-02 kartu - Added #57 Spanish localization (by Carlos)
//	2011-03-21 kartu - Added Ukrainian localization by Bookoman
//	2011-04-01 kartu - Renamed language files to corresponding 2 letter ISO codes
//	2011-07-04 Mark Nord - Added #38 "Standby image"
//	2011-07-04 Mark Nord - Added #24 "Displaying first page of the book on standby" based on code found by Ben Chenoweth
//	2011-07-06 Ben Chenoweth - Minor fix to StandbyImage (mime not needed)
//	2011-09-10 Mark Nord - 	added localised "Sleeping.." to curretn page-StandbyImage;
//	2011-09-12 Mark Nord - 	FIXED first book-page as StandbyImage for all file-formats
//	2011-09-16 Mark Nord - 	Fixed display correct page on page-turn after waking from sleep with book-cover as standby image
//	2011-10-08 Mark Nord - 	Fixed #195 "blank" & "Sleeping..." for landscape-mode by making coordinates dynamic (thx quisvir)
//				show cover and wallpaper always in portrait, no more need for /landscape/ - subfolder 
//				will flash once in portrait before resume with landscape-mode, due to needed ebook.rotate()
//				could be avoided with inverse code in doResume(), but then resume will take noticeable longer
//	2011-10-09 Mark Nord - 	preserve ascept-ratio for cover-pages (using code from quisvir)
//	2011-10-11 Mark Nord -  code tidying for cover/wallpaper on standby
//	2011-12-30 quisvir - Added scaling option due to popular demand

var tmp = function() {
	var oldSetLocale, localize;
	//-----------------------------------------------------------------------------------------------------
	// Localization related code is model specific.  
	// Replacing default  "choose language" UI
	//-----------------------------------------------------------------------------------------------------
	localize = function(Core) {
		try {
			var i, n, currentLang, settingsNode, langNode, languages, langNames, enter, node, langFile;
			currentLang = kbook.model.language;
	
			settingsNode = kbook.root.nodes[6];
			languages = ["en", "es", "de", "fr", "ka", "it", "nl", "ua"];
			langNames = {
				en: "English",
				de: "Deutsch", 
				es: "Español",
				fr: "Français",
				it: "Italiano",	
				ka: "ქართული",
				nl: "Nederlands", 
				ua: "Українська"
			};
	
			if (currentLang === undefined) {
				currentLang = "en";
			}
	
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
			settingsNode.nodes[4] = langNode;
			
			// self destruct :)
			delete this.localize;
			
			// Language strings were loaded, time to init Core
			PARAMS.loadAddons();
			Core.init();
		} catch (e) {
			PARAMS.bootLog("localize", e);
		}
	};
	
	// Init language related stuff once setLocale was called and strings were loaded
	oldSetLocale = Fskin.localize.setLocale;
	Fskin.localize.setLocale = function() {
		try {
			oldSetLocale.apply(this, arguments);
			localize(PARAMS.Core);
			// restore "old" set locale
			Fskin.localize.setLocale	= oldSetLocale;
		} catch (e) {
			PARAMS.bootLog("in overriden setLocale", e);
		}
	};

	// renders current books first page, for epub it is copy 'n past from 600's BookUtil	
	createTextThumbnail = function (path) {
		var bitmap, viewer, bounds, mime, page, log, oldpage; // oldpart;

		viewer = null;
		log = Core.log.getLogger("createTextThumbnail");
		try {
			mime = FileSystem.getMIMEType(path);
			if (mime === "application/epub+zip") {
				bounds = new Rectangle();
				viewer = new Document.Viewer.URL('file://' + path, mime);
				bounds.set(0, 0, 600, 800);
				viewer.set(Document.Property.dimensions, bounds);
				viewer.set(Document.Property.textEngine, 'FreeType');
				viewer.set(Document.Property.font, 'Dutch801 Rm BT');	
				bitmap = viewer.render();
			}
			else { // it's a LRF BBeB-Book or PDF
				page = kbook.model.container.sandbox.PAGE_GROUP.sandbox.PAGE;
				oldpage = page.data.get(Document.Property.page);
				page.data.set(Document.Property.page, 0);
				bitmap = page.data.render();
				page.data.set(Document.Property.page, oldpage);
			}	
		}
		catch (e){
			log.error("createTextThumbnail e:"+ e);
		}
		finally {
			if (viewer) {
				viewer.close();
			}
		}	
		return bitmap;
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
	var orgOrientation = false;
	kbook.model.container.sandbox.doSuspend = function() {
	var log, standbyImage;
	try {	
		log = Core.log.getLogger("doSuspend");
		
		standbyImage = kbook.model.container.findContent('STANDBY_IMAGE');

		standbyImage.draw = function() {
			var window, path, bitmap, x, y, bounds, ratio, width, height, ditheredBitmap;
			var mode, dither, L, oldTextStyle, oldTextSize, oldPenColor;
			window = this.root.window;
			mode = Core.addonByName.StandbyImage.options.mode;
			dither = Core.addonByName.StandbyImage.options.dither === "true";
			try {
				if (mode === 'cover') {
					// attempt to use current book cover
					path = kbook.model.currentBook.media.source.path + kbook.model.currentBook.media.path;
					bitmap = createTextThumbnail(path);
				}		     			
				if (!bitmap  && (mode === 'random' || mode === 'cover')) {
					// if no book cover, then use random wallpaper; 
					path = getRandomWallpaper();
					if (FileSystem.getFileInfo(path)) bitmap = new Bitmap(path);
				}
				if (bitmap) {		
					// if bitmap, then display it preserving aspect ratio
					// width/hight intentionally uses as absolute values: 600/800
					window.setPenColor(Color.white);
					window.fillRectangle(0, 0, 600, 800);
					x = 0;
					y = 0;
					switch (Core.addonByName.StandbyImage.options.ScalingMethod) {
						case 'keepaspect':
							bounds = bitmap.getBounds();
							ratio = (bounds.height/bounds.width > 800/600)?(800 / bounds.height):(600 / bounds.width);
							width = Math.floor(bounds.width * ratio);
							height = Math.floor(bounds.height * ratio);
							if (height > width) x = Math.floor((600 - width) / 2);
							else y = Math.floor((800 - height) / 2);
							break;
						case 'stretch':
							width = 600;
							height = 800;
					}
					ditheredBitmap = bitmap.dither(dither);
					bitmap.close();
					if (ditheredBitmap) {
						window.drawBitmap(ditheredBitmap, x, y, width, height);
						ditheredBitmap.close();
						Core.ui.updateScreen();
						return;
					}
				}					     		
	      		} catch (e) {
	      			log.error("Exception in cover/random " , e); 
	      		}	       		
			if (mode !=='act_page'){
				// blank screen & return
				try {	
					window.beginDrawing();
					oldPenColor = window.getPenColor();
					window.setPenColor(Color.white);
        				window.fillRectangle(0, 0, this.width, this.height);
	        			window.setPenColor(oldPenColor);
        				window.endDrawing();
					Core.ui.updateScreen();
					return;
				} catch (e) { 
					log.error("Exception in blank " , e); 
				}        			
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
				Core.ui.updateScreen();
			}
		};
		
		if (Core.addonByName.StandbyImage.options.mode === "cover" || Core.addonByName.StandbyImage.options.mode === "random") {
			orgOrientation = ebook.getOrientation();
			if (orgOrientation) {
				ebook.resetOrientation();
				Core.ui.updateScreen(); // dosn't work without this !?
			}
		}
		standbyImage.draw();
	} catch (e1){
		log.trace("Exception in doSuspend " + e1)
		}	
	this.getModel().suspend();
	this.getDevice().doneSuspend();
	}; 

	var oldResume = kbook.model.container.sandbox.doResume;
	kbook.model.container.sandbox.doResume = function() {	
		oldResume.apply(this, arguments); 
		if (orgOrientation) ebook.rotate();
		orgOrientation = false;
	} 
	
	/*
		<function id="doDigit" params="part"><![CDATA[
			var c = this.PAGE.countPages().toString().length - 1;
			var s = "";
			for (var i = 0; i < c; i++)
				s += "_";
			s += part.key.charAt(0);
			this.setVariable("GOTO_VARIABLE", s);
			var container = this.container;
			container.beforeModal(container.GOTO_GROUP);
		]]></function>
	*/
	// First digit is ignored, if it is zero, when opening "goto" dialog (original function quoted above)
	kbook.model.container.sandbox.PAGE_GROUP.sandbox.doDigit = function(part) {
		try {
			var c, s, i, container, key;
			PARAMS.bootLog("sandbox.PAGE is " + this.sandbox.PAGE);
			c = this.sandbox.PAGE.countPages().toString().length - 1;
			s = "";
			for (i = 0; i < c; i++) {
				s += "_";
			}
			key = part.key.charAt(0);
			if (key !== "0") {
				s += key;
			} else {
				s += "_";
			}
			this.setVariable("GOTO_VARIABLE", s);
			container = kbook.model.container;
			container.sandbox.beforeModal.call(container, container.sandbox.GOTO_GROUP);
		} catch (ignore) {
			PARAMS.bootLog("error in doDigit: " + ignore);
		}
	};
	
	// Fix sorting
	var compareStrings =  PARAMS.Core.config.compat.compareStrings;
	String.prototype.localeCompare = function(a) {
		return compareStrings(this.valueOf(), a);
	};
};

try {
	tmp();
} catch (ignore) {
}
