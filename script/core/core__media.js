// Name: Core Media
// Description: Provides media (books, images, music, notes) related services (indexing etc)
// Author: kartu
//
// History:
//	2010-07-07 kartu - Initial version
//	2010-07-09 kartu - Renamed file so that it is loaded before other modules
//	2010-10-24 kartu - Changed the way media lookup is done, now using xdb
//				Added findLibrary function
//				Fixes issue #15 (Maximum number of PRS+ indexed files limited by 1200)
//	2010-11-11 kartu - Added isImage function
//	2011-03-02 kartu - Added loadMedia, 
//			createMediaNode assumes path is actually media object, if its type is not string
//
tmp = function() {
	var findLibrary, findMedia, loadMedia, createMediaNode, isImage, startsWith, cachedSource;
	// Shortcut
	startsWith = Core.text.startsWith; 
	cachedSource = null;
	
	/**
	* Finds kinoma "source" (instance of FskCache.source) corresponding to the given full path
	*/
	findLibrary = function (path) {
		// Find library source responsible for handling the path
		var i, n, sources, source;
		if (cachedSource && startsWith(path, cachedSource.path)) {
			return cachedSource;
		}
		source = null;
		sources = kbook.model.cache.sources;
		for (i = 0, n = sources.length; i < n; i++) {
			if (startsWith(path, sources[i].path)) {
				source = sources[i];
				cachedSource = source;
				break;
			}
		}
		return source;
	};
	
	/**
	* Given full file path returns found media instance or null, if it cannot be found
	*/
	findMedia = function (path) {
		try {
			// Find source responsible for handling the path
			var source = findLibrary(path);
			if (source) {
				// Ask library to find media record
				return source.getRecordByPath(path.substring(source.path.length));
			}
		} catch (e) {
			log.error("Finding media " + path, e);
		}
		return null;
	};
	
	/**
	* Loads (unscanned) media file
	*/
	loadMedia = function(path) {
		var library, item;
		library = findLibrary(path);
		item = library.makeItemFromFile(path);
		item.path = path.substring(library.path.length);
		library.insertRecord(item);
		return item;
	};

	
	/**
	* Creates media node (book, image, note etc) for media with a given path, returns null if media cannot be found.
	*/
	createMediaNode = function (path, parent) {
		var i, n, node, media, mediaTypes, mediaTypesStr, mediaNodePrototypes;
		if (typeof path === "string") {
			media = findMedia(path);
		} else {
			media = path;
		}
		mediaTypes = Core.config.compat.media.types;
		mediaTypesStr = Core.config.compat.media.kinds;
		mediaNodePrototypes = Core.config.compat.media.prototypes;
		
		if (media !== null) {
			for (i = 0, n = mediaTypes.length; i < n; i++) {
				if (xs.isInstanceOf(media, mediaTypes[i])) {
					node = xs.newInstanceOf(mediaNodePrototypes[i]);
					node.media = media;
					node.cache = kbook.model.cache;
					node.parent = parent;
					node.depth = parent.depth + 1;
					node.type = mediaTypesStr[i];
					return node;
				}
			}
		}
		
		return null;	
	};
	
	isImage = function (path) {
		var mime = FileSystem.getMIMEType(path);
		return mime && !mime.indexOf('image/');
	};
	
	Core.media = {
		/**
		* Finds media (book, image, audio, etc) with a given path
		* @returns null, if media cannot be found
		*/
		findMedia: findMedia,
		
		/**
		* Loads (unscanned) media file
		*/
		loadMedia: loadMedia,

		/**
		* Finds kinoma "library source" (instance of FskCache.source) corresponding to the given full path
		*/
		findLibrary: findLibrary,
		
		
		/**
		* Creates node corresponding to the given path with a given title
		* @returns null, if media cannot be found
		*/
		createMediaNode: createMediaNode,

		/**
		* Determines whether given file is an image
		*/
		isImage: isImage
	};
};

try {
	tmp();
	tmp = undefined;
} catch (e) {
	log.error("in core media", e);
}
