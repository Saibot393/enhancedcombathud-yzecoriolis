import {ModuleName} from "./utils.js";

Hooks.once("init", () => {  // game.settings.get(cModuleName, "")
  //Settings
  //client
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
  
});