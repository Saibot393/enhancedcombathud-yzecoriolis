import {ModuleName} from "./utils.js";

Hooks.once("init", () => {  // game.settings.get(cModuleName, "")
  //Settings
  game.settings.register(ModuleName, "InjurieTable", {
	name: game.i18n.localize(ModuleName+".Settings.InjurieTable.name"),
	hint: game.i18n.localize(ModuleName+".Settings.InjurieTable.descrp"),
	scope: "world",
	config: true,
	type: String,
	default: "DDVWH940Z9SO4eGX"
  });
  
  //client
  game.settings.register(ModuleName, "AutoRollInjuries", {
	name: game.i18n.localize(ModuleName+".Settings.AutoRollInjuries.name"),
	hint: game.i18n.localize(ModuleName+".Settings.AutoRollInjuries.descrp"),
	scope: "client",
	config: true,
	type: Boolean,
	default: false,
	requiresReload: false
  });
  
  game.settings.register(ModuleName, "TalentsThreshold", {
	name: game.i18n.localize(ModuleName+".Settings.TalentsThreshold.name"),
	hint: game.i18n.localize(ModuleName+".Settings.TalentsThreshold.descrp"),
	scope: "client",
	config: true,
	type: Number,
	range: {
		min: 1,
		max: 20,
		step: 1
	},
	default: 3,
	requiresReload: true
  });
  
  game.settings.register(ModuleName, "UseDiceCircles", {
	name: game.i18n.localize(ModuleName+".Settings.UseDiceCircles.name"),
	hint: game.i18n.localize(ModuleName+".Settings.UseDiceCircles.descrp"),
	scope: "client",
	config: true,
	type: Boolean,
	default: false,
	requiresReload: true
  });
  
  game.settings.register(ModuleName, "ShowAimedQuick", {
	name: game.i18n.localize(ModuleName+".Settings.ShowAimedQuick.name"),
	hint: game.i18n.localize(ModuleName+".Settings.ShowAimedQuick.descrp"),
	scope: "client",
	config: true,
	type: Boolean,
	default: false,
	requiresReload: true
  });
  
});