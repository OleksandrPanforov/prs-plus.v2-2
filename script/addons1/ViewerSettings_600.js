// Name: ViewerSettings_600
// Description: Allows to 
//	disables doubleTapAction and so dictionary
//	disable pageturn gesture
// Based on ViewerSettings_x50 by Mark Nord
// Modified for the 600 by Ben Chenoweth
//
// History:
//	2011-08-31 Ben Chenoweth - Initial version
//  2011-09-01 Ben Chenoweth - Used appropriate icons
//	2011-09-02 quisvir - Added option to enable scrolling in Zoom Lock mode
//	2011-09-08 quisvir - Renamed scrolling (in zoom lock) to panning
//	2011-09-29 quisvir - Added Page Turn by Single Tap
//	2011-10-01 quisvir - Close reading popup menu (dict etc) and cancel selection by tapping page
//	2011-10-13 quisvir - Fixed #196 "No Page Turn with Gestures" doesn't disable Multi-Page Turn
//  2011-10-13 Ben Chenoweth - assigned more icons
//	2011-11-26 quisvir - Fixed Issue #228 "No Page Turn with Gestures" doesn't disable page turns through pageShortcutOverlayModel

tmp = function() {

	// Localize	 	
	var L = Core.lang.getLocalizer("ViewerSettings_x50");
	var log = Core.log.getLogger('ViewerSettings_600');

	// Constants

	// Close reading popup menu (dict etc) and cancel selection by tapping page
	pageShortcutOverlayModel.doTap = function (x, y) {
		if (kbook.model.doSomething('checkTap', x, y)) kbook.model.doSomething('doTap', x, y);
		else if (ViewerSettings_600.options.ClosePopupByPageTap == 'true') kbook.model.doSomething('selectNone');
		else {
			kbook.model.doBlink();
			return;
		}
		this.doCloseShortcut();
	};
	
	// Enable Page Turn by Single Tap
	var readingTapX, readingTapY;
	var oldSelectNoneWithoutUpdate = Fskin.kbookPage.selectNoneWithoutUpdate;
	var oldDoBlink = kbook.model.doBlink;
	var doNothingFunc = function () {};
	
	// Call PageTurnByTap when tap is not a link, highlight etc.
	var oldOnPageTapped = Fskin.kbookPage.readingTracker.tap;
	Fskin.kbookPage.readingTracker.tap = function (target, x, y) {
		if (ViewerSettings_600.options.PageTurnBySingleTap != 'false' && !target.selection.length) {
			readingTapX = x;
			readingTapY = y;
			target.selectNoneWithoutUpdate = PageTurnByTap;
			kbook.model.doBlink = doNothingFunc;
			oldOnPageTapped.apply(this, arguments);
			target.selectNoneWithoutUpdate = oldSelectNoneWithoutUpdate;
			kbook.model.doBlink = oldDoBlink;
		}
		else oldOnPageTapped.apply(this, arguments);
	}
	
	// Determine what to do with tap based on preference
	var PageTurnByTap = function () {
		switch (ViewerSettings_600.options.PageTurnBySingleTap) {
			case 'anywhere':
				this.doNext();
				return;
			case 'leftright':
				if (readingTapX < (this.width / 2)) this.doPrevious();
				else this.doNext();
				return;
			case 'rightleft':
				if (readingTapX < (this.width / 2)) this.doNext();
				else this.doPrevious();
				return;
			case 'topbottom':
				if (readingTapY < (this.height / 2)) this.doPrevious();
				else this.doNext();
				return;
			case 'bottomtop':
				if (readingTapY < (this.height / 2)) this.doNext();
				else this.doPrevious();
		}
	};
	
	// Enable panning in Zoom Lock mode
	var zoomLockOld;
	
	var oldZoomdoDrag = Fskin.kbookZoomOverlay.doDrag;
	Fskin.kbookZoomOverlay.doDrag = function (x, y, type, tapCount) {
		zoomLockOld = this.isZoomLock;
		if (ViewerSettings_600.options.ZoomLockPanning == "true" && zoomLockOld) this.isZoomLock = false;
		oldZoomdoDrag.apply(this, arguments);
		this.isZoomLock = zoomLockOld;
	}
	
	var oldZoomOverlaydone = Fskin.kbookZoomOverlay.done;
	Fskin.kbookZoomOverlay.done = function () {
		if (zoomLockOld) this.isZoomLock = true;
		oldZoomOverlaydone.apply(this, arguments);
		this.isZoomlock = zoomLockOld;
	};

	Fskin.kbookZoomOverlay.canLine = function () {
		if (this.getVariable('STATE') == 'PAGE' && this.isZoomLock && ViewerSettings_600.options.ZoomLockPanning != "true") return true;
		else return false;
	};

	Fskin.kbookZoomOverlay.canLineAndHold = function () {
		if (this.getVariable('STATE') == 'PAGE' && this.isZoomLock && ViewerSettings_600.options.ZoomLockPanning != "true") return true;
		else return false;
	};

	// overload Fskin.kbookPage.doSelectWord called by Fskin.kbookPage.readingTracker.doubleTap to disable Dictionary
	var oldDoSelectWord = Fskin.kbookPage.doSelectWord;
	Fskin.kbookPage.doSelectWord = function () {
		if (ViewerSettings_600.options.NoDictionary === "false") return oldDoSelectWord.apply(this, arguments);
	}

	var ViewerSettings_600 = {
		name: "ViewerSettings_600",
		settingsGroup: "viewer",
		optionDefs: [
			{
				name: "NoDictionary",
				title: L("OPTION_NODICT"),
				icon: "NODICTIONARY",
				defaultValue: "false",
				values: ["true", "false"],
				valueTitles: {
					"true": L("VALUE_TRUE"),
					"false": L("VALUE_FALSE")
				}
			},
			{
				name: "ClosePopupByPageTap",
				title: L("CLOSE_POPUP_BY_PAGE_TAP"),
				icon: "STYLUS",
				defaultValue: "false",
				values: ["true", "false"],
				valueTitles: {
					"true": L("VALUE_TRUE"),
					"false": L("VALUE_FALSE")
				}
			},
			{
				name: "NoGesturePageTurn",
				title: L("OPTION_NOGESTURE"),
				icon: "GESTURE",
				defaultValue: "false",
				values: ["true", "false"],
				valueTitles: {
					"true": L("VALUE_TRUE"),
					"false": L("VALUE_FALSE")
				}	
			},
			{
				name: "PageTurnBySingleTap",
				title: L("PAGE_TURN_BY_SINGLE_TAP"),
				icon: "GESTURE",
				defaultValue: "false",
				values: ["false", "anywhere", "leftright", "rightleft", "topbottom", "bottomtop"],
				valueTitles: {
					"false": L("VALUE_FALSE"),
					"anywhere": L("ANYWHERE_NEXT"),
					"leftright": L("LEFT_PREVIOUS_RIGHT_NEXT"),
					"rightleft": L("RIGHT_PREVIOUS_LEFT_NEXT"),
					"topbottom": L("TOP_PREVIOUS_BOTTOM_NEXT"),
					"bottomtop": L("BOTTOM_PREVIOUS_TOP_NEXT"),
				}	
			},
			{
				name: "ZoomLockPanning",
				title: L("ZOOMLOCK_PANNING"),
				icon: "SEARCH_ALT",
				defaultValue: "false",
				values: ["true", "false"],
				valueTitles: {
					"true": L("VALUE_TRUE"),
					"false": L("VALUE_FALSE")
				}
			}
		],
		/**
		* @constructor
		*/
		onInit: function () {
			this.onSettingsChanged();
		},
		onSettingsChanged: function (propertyName, oldValue, newValue, object) {
			Fskin.kbookPage.canLine = Fskin.kbookPage.canLineAndHold = (ViewerSettings_600.options.NoGesturePageTurn === "true") ? function () {return false;} : function () {return !this.preventLine;};
			pageShortcutOverlayModel.canLine = (ViewerSettings_x50.options.NoGesturePageTurn === "true") ? function () {return false;} : function () {return this.targetModel.doSomething('canLine');};
			pageShortcutOverlayModel.canLineAndHold = (ViewerSettings_x50.options.NoGesturePageTurn === "true") ? function () {return false;} : function () {return this.targetModel.doSomething('canLineAndHold');};
		},
		actions: [{
			name: "toggleGestureOnOff",
			title: L("ACTION_toggleGestureOnOff"),
			group: "Utils",
			icon: "GESTURE",
			action: function () {
				ViewerSettings_600.options.NoGesturePageTurn = (ViewerSettings_600.options.NoGesturePageTurn == 'true') ? 'false' : 'true';
				Fskin.kbookPage.canLine = Fskin.kbookPage.canLineAndHold = (ViewerSettings_600.options.NoGesturePageTurn === "true") ? function () {return false;} : function () {return !this.preventLine;};
				pageShortcutOverlayModel.canLine = (ViewerSettings_x50.options.NoGesturePageTurn === "true") ? function () {return false;} : function () {return this.targetModel.doSomething('canLine');};
				pageShortcutOverlayModel.canLineAndHold = (ViewerSettings_x50.options.NoGesturePageTurn === "true") ? function () {return false;} : function () {return this.targetModel.doSomething('canLineAndHold');};
				Core.ui.showMsg(L("OPTION_NOGESTURE") + ': ' + ((ViewerSettings_600.options.NoGesturePageTurn == 'true')?L("VALUE_TRUE"):L("VALUE_FALSE")));
			}
		}] 	
	};

	Core.addAddon(ViewerSettings_600);
};
try {
	tmp();
} catch (e) {
	// Core's log
	log.error("in ViewerSettings_600.js", e);
}
