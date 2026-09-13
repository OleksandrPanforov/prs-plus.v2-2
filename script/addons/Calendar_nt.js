/* Name: Calendar app (Non Touch version)
   Original code (c) Ben Chenoweth
   Initial version: July 2011
*/

tmp = function() {
	var appIcon = "DATE";
	var L = Core.lang.getLocalizer("Calendar");
	var Calendar = {
		name: "Calendar",
		title: L("TITLE"),
		description: "Calendar app",
		icon: appIcon,			
		activate: function () {
			kbook.autoRunRoot.sandbox._icon =  Core.config.compat.NodeKinds.getIcon(appIcon,0);
			kbook.autoRunRoot.sandbox._title = Calendar.title;
			kbook.autoRunRoot.sandbox.getSoValue = Core.system.getSoValue;
			kbook.autoRunRoot.sandbox.setSoValue = Core.system.setSoValue;
			kbook.autoRunRoot.sandbox.hasNumericButtons = Core.config.compat.hasNumericButtons;
			kbook.autoRunRoot.sandbox.getFileContent = Core.io.getFileContent;
			kbook.autoRunRoot.sandbox.startsWith = Core.text.startsWith;
			kbook.autoRunRoot.sandbox.gamesSavePath = Core.config.userGamesSavePath;
			kbook.autoRunRoot.sandbox.L = L;
			kbook.autoRunRoot.path = Core.config.addonsPath + "Calendar_nt/calendar.xml";
			kbook.autoRunRoot.sandbox.model = Core.config.model;
			kbook.autoRunRoot.enterIf(kbook.model);
		},
		actions: [{
			name: "Calendar",
			group: "Games",
			title: L("TITLE"),
			icon: appIcon,
			action: function () {
				Calendar.activate();
			}
		}]
	};
	
	Core.addAddon(Calendar);
};
try {
	tmp();
} catch (e) {
	// Core's log
	log.error("in Calendar_nt.js", e);
}