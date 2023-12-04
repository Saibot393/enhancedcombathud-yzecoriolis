import {ModuleName} from "./utils.js";

const ItemReplacementID = "_argonUI_";

var MYZECHActionItems = {};

var MYZECHManeuverItems = {};

var MYZECHReactionItems = {};

function registerMYZECHSItems () {
	MYZECHActionItems = {
		groupflags : {
			actiontype : "action"
		},
		Help : {
			img: "modules/enhancedcombathud-mutant-year-zero/icons/thumb-up.svg",
			name: game.i18n.localize(ModuleName+".Titles.Help"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.Help")
			}
		},
		Hinder : {
			img: "modules/enhancedcombathud-mutant-year-zero/icons/thumb-down.svg",
			name: game.i18n.localize(ModuleName+".Titles.Hinder"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.Hinder")
			}
		}
	}
	
	MYZECHManeuverItems = {
		groupflags : {
			actiontype : "maneuver"
		},
		Move : {
			img: "modules/enhancedcombathud/icons/svg/journey.svg",
			name: game.i18n.localize(ModuleName+".Titles.Move"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.Move")
			}
		},
		TakeCover : {
			img: "modules/enhancedcombathud/icons/svg/armor-upgrade.svg",
			name: game.i18n.localize(ModuleName+".Titles.TakeCover"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.TakeCover")
			}
		},
		DrawWeapon : {
			img: "modules/enhancedcombathud-mutant-year-zero/icons/pistol-gun.svg",
			name: game.i18n.localize(ModuleName+".Titles.DrawWeapon"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.DrawWeapon")
			}
		},
		Reload : {
			img: "modules/enhancedcombathud-mutant-year-zero/icons/reload-gun-barrel.svg",
			name: game.i18n.localize(ModuleName+".Titles.Reload"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.Reload")
			}
		}
	}
	
	MYZECHReactionItems = {
		groupflags : {
			actiontype : "react"
		},
		Defend : {
			img: "icons/svg/shield.svg",
			name: game.i18n.localize(ModuleName+".Titles.Defend"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.Defend"),
				skill : "FIGHT",
				skillRobot : "FORCE"
			}
		}
	}
	
	//some preparation
	for (let itemset of [MYZECHActionItems, MYZECHManeuverItems, MYZECHReactionItems]) {
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
}

export {registerMYZECHSItems, MYZECHActionItems, MYZECHManeuverItems, MYZECHReactionItems}