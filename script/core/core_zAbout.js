// Name: About
// Description: Adds PRS+ stuff to the about screen 
// Author: kartu
//
// History:
//	2010-03-14 kartu - Initial version, refactored from Utils
//	2010-04-05 kartu - Added Core.version object.
//	2010-04-17 kartu - Moved global vars into local functions context
//	2010-05-20 kartu - Removed script reference from about string
//	2010-06-27 kartu - Fixed error log message (was refering to core-hook2, instead of lang)
//	2010-06-27 kartu - Adapted for 300
//	2011-01-29 kartu - Adapted for x50
//	2011-02-27 kartu - Fixed #69 PRS+ About information missing
//	2011-11-04 kartu - Added Dutch & Turkish translation credits

try {
	// dummy function, to avoid introducing global vars
	tmp = function() {
		var prspFirmwareVersion, initAbout, initAboutX50, aboutText;
		prspFirmwareVersion = Core.io.getFileContent(System.applyEnvironment("[prspVersionFile]"), "n/a");

		Core.version = {
			firmware: prspFirmwareVersion
		};

		aboutText = 
			"Author: Mikheil Sukhiashvili aka kartu (kartu3@gmail.com) using work of: " + 
			"igorsk, boroda, amutin, obelix, pepak, kravitz, Mark Nord, Ben Chenoweth, quisvir and others.\n" +
			"Translations by:\n" +
			"     Catalan: surquizu\n" +
			"     Czech: Hobogen, milanv\n" +
			"     Dutch: DrMerry\n" +
			"     French: VICTORSJG, Duglum, ronnn, dpierron\n" +
			"     Georgian: rawerfas, kartu\n" +
			"     German: Duglum, klawong, Mark Nord\n" +			
			"     Italian: Samhain, Salvatore Ingala\n" +
			"     Portuguese: Olympio Neto\n" +
			"     Simplified Chinese: thawk, frank0734\n" +
			"     Spanish: surquizu, VICTORSJG, Carlos\n" +
			"     Turkish: Ugur Bulgan, Abdullah Demirci \n" +
			"     Ukrainian: Bookoman\n" +
			"© GNU Lesser General Public License.";
		
		initAbout = function() {
			var about, data, records, record, record1, prspFirmwareVersion;
			// About
			about = kbook.model.container.sandbox.ABOUT_GROUP.sandbox.ABOUT;
			data = about.sandbox.data;
			records = data.records;
			record1 = data.getRecord(1);
			record = new Fskin.TableRecord(data, record1);
			prspFirmwareVersion = Core.io.getFileContent(System.applyEnvironment("[prspVersionFile]"), "n/a");
			record.sandbox.text = "PRS+ " + prspFirmwareVersion + "\n" + aboutText;
			record.sandbox.kind = 4;
			records.splice(0, 0, record);
			about.dataChanged();			
		};
		
		initAboutX50 = function() {
			var old = Fskin.kbookAbout.initialize;
			Fskin.kbookAbout.initialize = function() {
				var data, record, record1, versionText;
				try {
					data = this.data;
					record1 = data.getRecord(1);
					record = new Fskin.TableRecord(data, record1);
					versionText = "PRS+ " + prspFirmwareVersion;
					record.sandbox.kind = 6;
					record.sandbox.text = aboutText;
					data.records.splice(0, 0, record);
					record = new Fskin.TableRecord(data, record1);
					record.sandbox.text =  "PRS+ " + prspFirmwareVersion;
					record.sandbox.kind = 30;
					data.records.splice(0, 0, record);
				} catch (e) {
					log.error("Fskin.kbookAbout.initialize", e);
				}
				old.apply(this, arguments);
			};
		};
		
		switch (Core.config.model) {
			case "505":
			case "300":
			case "600":
			case "900":
				initAbout();
				break;
			default:
				initAboutX50();
		}
	};
	tmp();
	tmp = undefined;
} catch (e) {
	log.error("initializing core-about", e);
}