// Name: BookManagement_x50
// Description: Allows to set 'new' flag manually, to hide default collections,
//				to show reading progress in home menu and thumbnail views
//				and to customize home menu booklist
// 
// Author: quisvir
//
// History:
//	2011-08-29 quisvir - Initial version
//	2011-08-31 quisvir - Avoid assets.xml and change terminology
//	2011-09-04 Mark Nord - preserve Add-Collection, added icons
//	2011-09-05 quisvir - Extend Hide Collection options to 1 option per collection entry
//	2011-09-05 quisvir - Add reading progress in home menu and thumbnail views
//	2011-09-08 quisvir - Format options now correspond to statusbar options, and fewer strings needed
//	2011-09-09 quisvir - Added exception for reading progress in thumbnail checkbox view
//	2011-09-10 quisvir - Reading Progress: Fixed menu lockups in views other than books
//	2011-09-12 quisvir - Added Home Menu Booklist customization
//	2011-09-14 quisvir - Fixed Booklist bug on searching history (thanks MiK77)
//	2011-09-14 quisvir - Fixed bug in Reading Progress if there is no current book
//	2011-09-15 quisvir - Fixed bug where booklist wasn't correct after startup (via workaround)
//	2011-09-16 quisvir - More bugfixes, booklist partly rewritten
//	2011-09-18 quisvir - Rename to BookManagement_x50, booklist speed improvements, add random booklist option
//	2011-09-20 quisvir - Use PRS+ book history instead of cache for 'last opened books' booklist
//	2011-09-22 quisvir - Display current booklist option in home menu
//	2011-09-27 quisvir - Add ability to cycle through collections for 'next in collection' booklist
//	2011-09-28 quisvir - Display current collection in home menu, add option to ignore memory cards
//	2011-10-04 quisvir - Add option to treat periodicals as books

tmp = function() {

	var L = Core.lang.getLocalizer('BookManagement');
	var log = Core.log.getLogger('BookManagement');
	
	var bookChanged = false;
	var booklistTrigger = false;
	
	// Treat Periodicals as Books
	var oldBooksFilter = kbook.root.children.deviceRoot.children.books.filter;
	kbook.root.children.deviceRoot.children.books.filter = function (result) {
		if (BookManagement_x50.options.PeriodicalsAsBooks == 'true') return result;
		else return oldBooksFilter.apply(this, arguments);
	}
	
	var oldIsPeriodical = FskCache.text.isPeriodical;
	FskCache.text.isPeriodical = function () {
		if (BookManagement_x50.options.PeriodicalsAsBooks == 'true') return false;
		else return oldIsPeriodical.apply(this, arguments);
	}
	
	var oldIsNewspaper = FskCache.text.isNewspaper;
	FskCache.text.isNewspaper = function () {
		if (BookManagement_x50.options.PeriodicalsAsBooks == 'true') return false;
		else return oldIsNewspaper.apply(this, arguments);
	}
	
	var oldOnEnterShortCutBook = kbook.model.onEnterShortCutBook;
	kbook.model.onEnterShortCutBook = function (node) {
		if (BookManagement_x50.options.PeriodicalsAsBooks == 'true' && node.periodicalName) this.currentNode.gotoNode(node, this);
		else oldOnEnterShortCutBook.apply(this, arguments);
	};
	
	// Keep new flag as is on opening book
	var oldOnChangeBook = kbook.model.onChangeBook;
	kbook.model.onChangeBook = function (node) {
		if (this.currentPath) oldOnChangeBook.apply(this, arguments);
		else {
			var newflag = node.opened;
			oldOnChangeBook.apply(this, arguments);
			if (BookManagement_x50.options.ManualNewFlag == 'true') node.opened = newflag;
			bookChanged = true;
			BookManagement_x50.options.CurrentCollection = '';
		}
	}
	
	// Book menu option to switch new flag, called from main.xml
	kbook.model.container.sandbox.OPTION_OVERLAY_PAGE.sandbox.NewFlagToggle = function () {
		this.doOption();
		var book = kbook.model.currentBook;
		book.opened = (book.opened) ? false : true;
	}
	
	// Show book menu option if preference is set
	kbook.optMenu.isDisable = function (part) {
		if (this.hasString(part, 'manualnewflag')) {
			if (BookManagement_x50.options.ManualNewFlag == 'true') {
				part.text = (kbook.model.currentBook.opened) ? L('SETNEWFLAG') : L('REMOVENEWFLAG');
				return Fskin.overlayTool.isDisable(part);
			}
			else return true;
		}
		else return Fskin.overlayTool.isDisable(part);
	}

	// Hide default collections
	var oldKbookPlaylistNode = kbook.root.kbookPlaylistNode.construct;
	kbook.root.kbookPlaylistNode.construct = function () {
		oldKbookPlaylistNode.apply(this, arguments);
		if (BookManagement_x50.options.HideAddNewCollection == 'true') {
			this.nodes.splice(this.purchasedNodeIndex + 1,1);
			this.constNodesCount--;
		}
		if (BookManagement_x50.options.HidePurchasedBooks == 'true') {
			this.nodes.splice(this.purchasedNodeIndex,1);
			this.constNodesCount--;
			this.presetItemsCount--;
		}
		if (BookManagement_x50.options.HideUnreadPeriodicals == 'true') {
			this.nodes.splice(this.purchasedNodeIndex - 1,1);
			this.constNodesCount--;
			this.presetItemsCount--;
		}
		if (BookManagement_x50.options.HideUnreadBooks == 'true') {
			this.nodes.splice(this.purchasedNodeIndex - 2,1);
			this.constNodesCount--;
			this.presetItemsCount--;
		}
	}

	// Draw reading progress instead of 'last read' date/time
	kbook.model.getContinueDate = function (node) {
		if (BookManagement_x50.options.ShowReadingProgressCurrent == 'true' && this.currentBook && this.currentBook.media.ext.history.length) {
			var page = this.currentBook.media.ext.currentPosition.page + 1;
			if (page < Number(BookManagement_x50.options.OnlyShowFromPage)) return node.nodes[0].lastReadDate;
			var pages = this.currentBook.media.ext.history[0].pages;
			return readingProgressComment(page, pages, BookManagement_x50.options.ProgressFormatCurrent);
		}
		else return node.nodes[0].lastReadDate;
	}
	
	// Draw reading progress below thumbnails (both home screen and book lists)
	var oldThumbnaildrawRecord = Fskin.kbookViewStyleThumbnail.drawRecord;
	Fskin.kbookViewStyleThumbnail.drawRecord = function (offset, x, y, width, height, tabIndex, parts) {
		oldThumbnaildrawRecord.apply(this, arguments);
		var record, page, pages, message;
		if (kbook.model.currentNode.title == 'deviceRoot') {
			message = (BookManagement_x50.options.CurrentCollection) ? L('NEXT_IN') + ' ' + BookManagement_x50.options.CurrentCollection : BookManagement_x50.optionDefs[0].optionDefs[0].valueTitles[BookManagement_x50.options.HomeMenuBooklist];
			this.skin.styles[6].draw(this.getWindow(), message, 0, y-25, this.width, this.textCommentHeight);
		}
		record = this.menu.getRecord(offset);
		if (record && BookManagement_x50.options.ShowReadingProgressThumbs == 'true') {
				if (record.kind != 2 || !record.media.ext || !record.media.ext.history.length || (this.statusVisible && (record.media.sourceid > 1 || this.menu.getFixSelectPosition() || record.expiration))) return;
				page = record.media.ext.currentPosition.page + 1;
				if (page < Number(BookManagement_x50.options.OnlyShowFromPage)) return;
				pages = record.media.ext.history[0].pages;
				message = readingProgressComment(page, pages, BookManagement_x50.options.ProgressFormatThumbs);
				parts.commentStyle.draw(this.getWindow(), message, x+this.marginWidth, this.getNy(this.getTy(y),Math.min(this.getTh(height),this.thumbnailHeight))+this.textNameHeight+this.marginNameAndComment + 23, this.getCw(width, Fskin.scratchRectangle.width), this.textCommentHeight);
		}
	};
	
	// Format reading progress comment
	readingProgressComment = function (page, pages, format) {
		switch (format) {
			case '1': return L('PAGE') + ' ' + page + ' ' + L('OF') + ' ' + pages;
			case '2': return L('PAGE') + ' ' + page + ' ' + L('OF') + ' ' + pages + ' (' + Math.floor((page/pages)*100) + '%)';
			case '3': return page + ' ' + L('OF') + ' ' + pages;
			case '4': return page + ' ' + L('OF') + ' ' + pages + ' (' + Math.floor((page/pages)*100) + '%)';
			case '5': return Math.floor((page/pages)*100) + '%';
			case '6': return page + ' / ' + pages;
			case '7': return page + ' / ' + pages + ' (' + Math.floor((page/pages)*100) + '%)';
			case '8': return L('PAGE') + ' ' + page + ' / ' + pages + ' (' + Math.floor((page/pages)*100) + '%)';
		}
	}

	// Code to randomize array from jsfromhell.com
	arrayShuffle = function (v) {
		for (var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
		return v;
	};

	// Update deviceroot on enter
	var oldOnEnterDeviceRoot = kbook.model.onEnterDeviceRoot;
	kbook.model.onEnterDeviceRoot = function () {
		oldOnEnterDeviceRoot.apply(this, arguments);
		if (BookManagement_x50.options.HomeMenuBooklist && bookChanged) {
			kbook.root.nodes[0].nodes[6].update(kbook.model);
			bookChanged = false;
		}
	}
	
	// Update 'next in collection' booklist after collection edit
	var oldFinishCollectionEdit = kbook.model.finishCollectionEdit;
	kbook.model.finishCollectionEdit = function () {
		oldFinishCollectionEdit.apply(this, arguments);
		if (BookManagement_x50.options.HomeMenuBooklist == 3) bookChanged = true; // TODO update only if current collection is changed
	}
	
	// Customize book list in home menu
	// Maybe move (option) to Menu Customizer?
	kbook.root.children.deviceRoot.children.bookThumbnails.construct = function () {
		var i, nodes, prototype, cache, result, records, node;
		FskCache.tree.xdbNode.construct.call(this);
		nodes = this.nodes = [];
		prototype = this.prototype;
		cache = this.cache;
		while (cache) {
			if (BookManagement_x50.options.IgnoreCards == 'true') result = cache.getSourceByName('mediaPath').textMasters;
			else result = cache.textMasters;
			if (BookManagement_x50.options.PeriodicalsAsBooks == 'false') result = this.filter(result);
			records = result.count();
			if (!records) return;
			switch (BookManagement_x50.options.HomeMenuBooklist) {
				case 0: // Booklist option: last added books
					obj0 = new Object();
					obj0.by = 'indexDate';
					obj0.order = xdb.descending;
					result.sort_c(obj0);
					for(i=0;i<3&&i<records;i++) {
						node = nodes[i] = xs.newInstanceOf(prototype);
						node.cache = cache;
						node.media = result.getRecord(i);
					}
					break;
				case 1: // Booklist option: last opened books
					var i, j, history=[], record;
					history = Core.addonByName.BookHistory.getBookList();
					j = (kbook.model.currentBook || kbook.model.currentPath) ? 1 : 0;
					for (i=0;nodes.length<3&&i+j<history.length;i++) {
						record = Core.media.findMedia(history[i+j]);
						if (record) {
							if (record.periodicalName && BookManagement_x50.options.PeriodicalsAsBooks == 'false') continue;
							node = nodes[nodes.length] = xs.newInstanceOf(prototype);
							node.cache = cache;
							node.media = record;
						}
					}
					break;
				case 2: // Booklist option: books by same author
					var i, currentbook, id, author, record, booklist=[];
					if (kbook.model.currentBook) currentbook = kbook.model.currentBook.media;
					else if (kbook.model.currentPath) currentbook = result.db.search('indexPath',kbook.model.currentPath).getRecord(0);
					if (!currentbook) break;
					id = currentbook.id;
					author = currentbook.author;
					if (author) {
						// Find other books by same author, excluding current book
						for (i=0;i<records;i++) {
							record = result.getRecord(i);
							if (record.author == author && record.id != id) booklist.push(i);
						}
						// Shuffle book list and add first 3 items to nodes
						booklist = arrayShuffle(booklist);
						for (i=0;i<3&&i<booklist.length;i++) {
							node = nodes[i] = xs.newInstanceOf(prototype);
							node.cache = cache;
							node.media = result.getRecord(booklist[i]);
						}
					}
					break;
				case 3: // Booklist option: next books in collection
					var i=0, j, k, l, id, result2, collections, collection, books;
					if (kbook.model.currentBook) id = kbook.model.currentBook.media.id;
					else if (kbook.model.currentPath) id = result.db.search('indexPath',kbook.model.currentPath).getRecord(0).id;
					if (id) {
						// Switch to collections cache
						result2 = cache.playlistMasters;
						result2.sort('indexPlaylist');
						collections = result2.count();
						if (BookManagement_x50.options.CurrentCollection) {
							for (i=0;i<collections&&result2.getRecord(i).title!=BookManagement_x50.options.CurrentCollection;i++);
							if (i==collections) i=0;
							else if (booklistTrigger) i++;
						}
						while (i<collections) {
							collection = result2.getRecord(i);
							books = collection.count();
							j = collection.getItemIndex(id) + 1;
							if (j && j<books) {
								// Current book found in collection where it's not the last book
								for (k=0;k<3&&j<books;j++,k++) {
									node = nodes[k] = xs.newInstanceOf(prototype);
									node.cache = cache;
									node.media = cache.getRecord(collection.items[j].id);
								}
								break;
							}
							i++;
						}
					}
					BookManagement_x50.options.CurrentCollection = (nodes.length) ? collection.title : '';
					break;
				case 4: // Booklist option: random books
					var i, j, id, books=[], record;
					if (kbook.model.currentBook) id = kbook.model.currentBook.media.id;
					else if (kbook.model.currentPath) id = result.db.search('indexPath',kbook.model.currentPath).getRecord(0).id;
					for (i=0;i<records;i++) books.push(i);
					books = arrayShuffle(books);
					for (i=0,j=0;i<3&&j<books.length;i++,j++) {
						record = result.getRecord(books[j]);
						if (record.id == id) i--;
						else {
							node = nodes[i] = xs.newInstanceOf(prototype);
							node.cache = cache;
							node.media = record;
						}
					}
				break;
			}
			if (booklistTrigger) {
				if (!nodes.length) {
					if (BookManagement_x50.options.HomeMenuBooklist == 4) BookManagement_x50.options.HomeMenuBooklist = 0;
					else BookManagement_x50.options.HomeMenuBooklist++;
					continue;
				}
				booklistTrigger = false;
			}
			break;
		}
	};
		
	var BookManagement_x50 = {
		name: 'BookManagement_x50',
		title: L('TITLE'),
		// icon: 'BOOKS',
		onInit: function () {
			// Workaround for numerical settings being saved as strings
			BookManagement_x50.options.HomeMenuBooklist = parseInt(BookManagement_x50.options.HomeMenuBooklist);
		},
		actions: [{
			name: 'CycleHomeMenuBooklist',
			title: L('CYCLE_HOME_MENU_BOOKLIST'),
			group: 'Other',
			action: function () {
				booklistTrigger = true;
				if (BookManagement_x50.options.HomeMenuBooklist == 4) BookManagement_x50.options.HomeMenuBooklist = 0;
				else if (BookManagement_x50.options.HomeMenuBooklist != 3) {
					BookManagement_x50.options.HomeMenuBooklist++;
					BookManagement_x50.options.CurrentCollection = '';
				}
				if (kbook.model.currentNode.title == 'deviceRoot') {
					kbook.root.nodes[0].nodes[6].update(kbook.model);
					kbook.menuHomeThumbnailBookData.setNode(kbook.root.nodes[0].nodes[6]);
				}
				else bookChanged = true;
				Core.settings.saveOptions(BookManagement_x50); // FIXME radio button in PRS+ settings isn't updated
			}
		}],
		optionDefs: [
			{
			groupTitle: L('CUSTOMIZE_HOME_MENU_BOOKLIST'),
			groupIcon: 'FOLDER',
			optionDefs: [
			{
				name: 'HomeMenuBooklist',
				title: L('BOOK_SELECTION'),
				defaultValue: 0,
				values: [0, 1, 2, 3, 4],
				valueTitles: {
					0: L('LAST_ADDED_BOOKS'),
					1: L('LAST_OPENED_BOOKS'),
					2: L('BOOKS_BY_SAME_AUTHOR'),
					3: L('NEXT_BOOKS_IN_COLLECTION'),
					4: L('RANDOM_BOOKS'),
				}
			},
			{
				name: 'IgnoreCards',
				title: L('IGNORE_MEMORY_CARDS'),
				defaultValue: 'false',
				values: ['true','false'],
				valueTitles: {
					'true': L('VALUE_TRUE'),
					'false': L('VALUE_FALSE')
				}
			},
			]},
			{
			groupTitle: L('SHOW_READING_PROGRESS'),
			groupIcon: 'FOLDER',
			optionDefs: [
				{
				name: 'ShowReadingProgressCurrent',
				title: L('SHOW_READING_PROGRESS_CURRENT'),
				defaultValue: 'false',
				values: ['true','false'],
				valueTitles: {
					'true': L('VALUE_TRUE'),
					'false': L('VALUE_FALSE')
				}
				},
				{
				name: 'ProgressFormatCurrent',
				title: L('PROGRESS_FORMAT_CURRENT'),
				defaultValue: '2',
				values: ['1', '2', '3', '4', '5', '6', '7', '8'],
				valueTitles: {
					'1': L('PAGE') + ' 5 ' + L('OF') + ' 100',
					'2': L('PAGE') + ' 5 ' + L('OF') + ' 100 (5%)',
					'3': '5 ' + L('OF') + ' 100',
					'4': '5 ' + L('OF') + ' 100 (5%)',
					'5': '5%',
					'6': '5 / 100',
					'7': '5 / 100 (5%)',
					'8': L('PAGE') + ' 5 / 100 (5%)'
				}
				},
				{
				name: 'ShowReadingProgressThumbs',
				title: L('SHOW_READING_PROGRESS_THUMBS'),
				defaultValue: 'false',
				values: ['true','false'],
				valueTitles: {
					'true': L('VALUE_TRUE'),
					'false': L('VALUE_FALSE')
				}
				},
				{
				name: 'ProgressFormatThumbs',
				title: L('PROGRESS_FORMAT_THUMBS'),
				defaultValue: '3',
				values: ['1', '2', '3', '4', '5', '6', '7', '8'],
				valueTitles: {
					'1': L('PAGE') + ' 5 ' + L('OF') + ' 100',
					'2': L('PAGE') + ' 5 ' + L('OF') + ' 100 (5%)',
					'3': '5 ' + L('OF') + ' 100',
					'4': '5 ' + L('OF') + ' 100 (5%)',
					'5': '5%',
					'6': '5 / 100',
					'7': '5 / 100 (5%)',
					'8': L('PAGE') + ' 5 / 100 (5%)'
				}
				},
				{
				name: 'OnlyShowFromPage',
				title: L('ONLY_SHOW_FROM_PAGE'),
				defaultValue: '2',
				values: ['1', '2', '3', '4', '5', '10', '15', '20', '25', '50'],
				},
			]},
			{
			groupTitle: L('HIDE_DEFAULT_COLLECTIONS'),
			// groupIcon: 'BOOKS',
			optionDefs: [
				{
					name: 'HideUnreadBooks',
					title: L('HIDE_UNREAD_BOOKS'),
					defaultValue: 'false',
					values: ['true','false'],
					valueTitles: {
						'true': L('VALUE_TRUE'),
						'false': L('VALUE_FALSE')
					}
				},
				{
					name: 'HideUnreadPeriodicals',
					title: L('HIDE_UNREAD_PERIODICALS'),
					defaultValue: 'false',
					values: ['true','false'],
					valueTitles: {
						'true': L('VALUE_TRUE'),
						'false': L('VALUE_FALSE')
					}
				},
				{
					name: 'HidePurchasedBooks',
					title: L('HIDE_PURCHASED_BOOKS'),
					defaultValue: 'false',
					values: ['true','false'],
					valueTitles: {
						'true': L('VALUE_TRUE'),
						'false': L('VALUE_FALSE')
					}
				},
				{
					name: 'HideAddNewCollection',
					title: L('HIDE_ADD_NEW_COLLECTION'),
					defaultValue: 'false',
					values: ['true','false'],
					valueTitles: {
						'true': L('VALUE_TRUE'),
						'false': L('VALUE_FALSE')
					}
				},
			]},
			{
				name: 'PeriodicalsAsBooks',
				title: L('TREAT_PERIODICALS_AS_BOOKS'),
				defaultValue: 'false',
				values: ['true', 'false'],
				valueTitles: {
					'true': L('VALUE_TRUE'),
					'false': L('VALUE_FALSE')
				}	
			},
			{
				name: 'ManualNewFlag',
				title: L('SET_NEW_FLAG_MANUALLY'),
				icon: 'NEW',
				defaultValue: 'false',
				values: ['true', 'false'],
				valueTitles: {
					'true': L('VALUE_TRUE'),
					'false': L('VALUE_FALSE')
				}	
			},
			{
				name: 'CurrentCollection',
				defaultValue: '',
				hidden: 'true',
			},
		],
		onSettingsChanged: function (propertyName, oldValue, newValue, object) {
			if (propertyName == 'HomeMenuBooklist' || propertyName == 'IgnoreCards') {
				bookChanged = true;
				BookManagement_x50.options.CurrentCollection = '';
			}
		},
	};

	Core.addAddon(BookManagement_x50);
};
try {
	tmp();
} catch (e) {
	// Core's log
	log.error('in BookManagement.js', e);
}
