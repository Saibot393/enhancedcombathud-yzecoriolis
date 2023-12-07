import {ModuleName} from "./utils.js";

const ItemReplacementID = "_argonUI_";

var CORIOLISECHActionItems = {};
var CORIOLISECHFreeActionItems = {}

function registerCORIOLISECHSItems () {
	let AP3Items = {
		groupflags : {
			APconsumption : 3
		},
		FirstAid : {
			img: "icons/svg/heal.svg",
			name: game.i18n.localize(ModuleName+".Titles.FirstAid"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.FirstAid")
			}
		},
		Tinkering : {
			img: "modules/enhancedcombathud-yzecoriolis/icons/tinker.svg",
			name: game.i18n.localize(ModuleName+".Titles.Tinkering"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.Tinkering")
			}
		}
	}
	
	let AP2Items = {
		groupflags : {
			APconsumption : 2
		},
		Reload : {
			img: "modules/enhancedcombathud-yzecoriolis/icons/reload-gun-barrel.svg",
			name: game.i18n.localize(ModuleName+".Titles.Reload"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.Reload")
			}
		}
	}
	
	let AP1Items = {
		groupflags : {
			APconsumption : 1
		},
		TakeCover : {
			img: "modules/enhancedcombathud/icons/svg/armor-upgrade.svg",
			name: game.i18n.localize(ModuleName+".Titles.TakeCover"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.TakeCover")
			}
		},
		Duck : {
			img: "icons/svg/down.svg",
			name: game.i18n.localize(ModuleName+".Titles.Duck"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.Duck")
			}
		},
		StandUp : {
			img: "icons/svg/up.svg",
			name: game.i18n.localize(ModuleName+".Titles.StandUp"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.StandUp")
			}
		},
		DrawWeapon : {
			img: "modules/enhancedcombathud-yzecoriolis/icons/bolter-gun.svg",
			name: game.i18n.localize(ModuleName+".Titles.DrawWeapon"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.DrawWeapon")
			}
		},
		Parry : {
			img: "modules/enhancedcombathud/icons/svg/crossed-swords.svg",
			name: game.i18n.localize(ModuleName+".Titles.Parry"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.Parry")
			}
		},
		Opportunity : {
			img: "modules/enhancedcombathud-yzecoriolis/icons/wide-arrow-dunk.svg",
			name: game.i18n.localize(ModuleName+".Titles.Opportunity"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.Opportunity")
			}
		},
		Overwatch : {
			img: "icons/svg/clockwork.svg",
			name: game.i18n.localize(ModuleName+".Titles.Overwatch"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.Overwatch")
			}
		}
	}
	
	CORIOLISECHFreeActionItems = {
		groupflags : {
			APconsumption : 0
		},
		Defend : {
			img: "icons/svg/shield.svg",
			name: game.i18n.localize(ModuleName+".Titles.Defend"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.Defend")
			}
		}
	}

	//some preparation
	for (let itemset of [AP3Items, AP2Items, AP1Items, CORIOLISECHFreeActionItems]) {
		for (let itemkey of Object.keys(itemset)) {
			if (itemkey != "groupflags") {
				itemset[itemkey].flags = {};
				itemset[itemkey].flags[ModuleName] = {...itemset.groupflags, ...itemset[itemkey].flags[ModuleName]};
				
				let ReplacementItem = game.items.find(item => item.name == ItemReplacementID + itemkey);
				
				if (ReplacementItem) {
					itemset[itemkey].system.description = ReplacementItem.system.description;
				}
			}
		}
		
		delete itemset.groupflags;
	}
	
	CORIOLISECHActionItems = {...AP3Items, ...AP2Items, ...AP1Items}
}

export {registerCORIOLISECHSItems, CORIOLISECHActionItems, CORIOLISECHFreeActionItems}