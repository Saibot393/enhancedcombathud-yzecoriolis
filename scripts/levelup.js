import {ModuleName, replacewords, getTooltipDetails} from "./utils.js";

const ConfirmIcon = "fa-solid fa-check";
const AddIcon = "fa-solid fa-plus";
const DeleteIcon = "fa-solid fa-trash";

const XPoptionsSetting = "XPoptions";

const skillmax = 5;

const skillcost = 5;
const talentcost = 5;

var defaultXPChoice = {};

class XPOptionsSettingWindow extends Application {
	constructor(Options = {}) {
		super(Options);
		
		this.optionssetting = XPoptionsSetting;
		
		this.XPOptions = game.settings.get(ModuleName, this.optionssetting);
	}
	
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			popOut: true,
			width: 800,
			height: 400,
			template: `modules/${ModuleName}/templates/defaultwindow.html`,
			jQuery: true,
			title: game.i18n.localize(ModuleName + ".Titles." + "XPOptions"),
			resizable: true
		});
	}
	
	async getData(pOptions={}) {
		return {
			content: await this.getHTML(pOptions)
		};
	}
	
	async getHTML(pOptions={}) {
		let vEntriesHTML = `<table name = "XPentries">`;
		
		vEntriesHTML = vEntriesHTML + 	`<tr name="header" style="border: 1px solid #dddddd">
											<th style="border: 1px solid #dddddd">${game.i18n.localize(ModuleName + ".Titles.XPOptions")}</th>
											<th style="border: 1px solid #dddddd"></th>
										</tr>`;
		
		for (const key of Object.keys(this.XPOptions)) {
			vEntriesHTML = vEntriesHTML + 	`	<tr name="${key}">
													<td> <input name="Name" type="text" value="${this.XPOptions[key].Name}"> </td>
													<td style="text-align: center"> <i name="delete" class="${DeleteIcon}"></i> </td>
												</tr>`;
		}
		
		vEntriesHTML = vEntriesHTML + `</table>`;
		
		//buttons	
		let vButtonsHTML = 				`<div class="form-group" style="display:flex;flex-direction:column;align-items:center;gap:1em;margin-top:1em">
											<button type="button" name="addXPOption"> <i class="${AddIcon}"></i> ${game.i18n.localize(ModuleName + ".Titles.addXPOption")} </button>
											<button type="button" name="confirmChanges"> <i class="${ConfirmIcon}"></i> ${game.i18n.localize(ModuleName + ".Titles.confirmChanges")} </button>
										</div>`;
										
		return vEntriesHTML + vButtonsHTML;
	}
	
	activateListeners(HTML) {
		const AddButton = HTML.find(`button[name="addXPOption"]`);
		
		AddButton.on("click", async () => {	await this.updateXPchoices();
											this.XPOptions[randomID()] = {...defaultXPChoice};
											this.render();});
											
		const channelEntries = HTML.find(`tr`);
		
		channelEntries.each((number, element) => {
			let id = $(element).attr("name");
			
			$(element).find(`i[name="delete"]`).on("click", () => {	delete this.XPOptions[id];
																	this.render()});
		});
		
		const confirmButton = HTML.find(`button[name="confirmChanges"]`);
		
		confirmButton.on("click", () => {	this.saveXPChoices();
											this.close()});
	}
	
	async updateXPchoices() {
		let HTML = this.element;
		
		let XPoptions = {};
		
		let entries = HTML.find(`table`).find(`tr`);
		
		const settingKeys = Object.keys(defaultXPChoice);
		
		entries.each((number, element) => {
			let id = $(element).attr("name");
			
			if (id != "header") {
				XPoptions[id] = {};
				
				for (const key of settingKeys) {
					const input = $(element).find(`[name="${key}"]`);
					
					XPoptions[id][key] = valueofInput(input);
				}
			}
		});
		
		this.XPOptions = XPoptions;
	}
	
	async saveXPChoices() {
		await this.updateXPchoices();
		
		game.settings.set(ModuleName, this.optionssetting, this.XPOptions);
	}
}

class gainXPWindow extends Application {
	constructor(actor, Options = {}) {
		super(Options);
		
		this.actor = actor;
		this.optionssetting = XPoptionsSetting;
		
		this.XPOptions = game.settings.get(ModuleName, this.optionssetting);
		
		if (!this.actor) {
			this.close();
		}
	}
	
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			popOut: true,
			width: 800,
			height: 400,
			template: `modules/${ModuleName}/templates/defaultwindow.html`,
			jQuery: true,
			title: game.i18n.localize(ModuleName + ".Titles." + "CharacterAdvancement"),
			resizable: true
		});
	}
	
	async getData(pOptions={}) {
		return {
			content: await this.getHTML(pOptions)
		};
	}
	
	async getHTML(pOptions={}) {
		let vEntriesHTML = `<span>${game.i18n.localize(ModuleName + ".Titles.CheckWhichApplies")}</span>`;
		
		for (const key of Object.keys(this.XPOptions)) {
			vEntriesHTML = vEntriesHTML + 	`<div class="XPoption" name="${key}">
												<input type="checkbox" id="${key}">
												<label for="${key}">${this.XPOptions[key].Name}</label>
											</div>`;
		}
		
		//buttons	
		let vButtonsHTML = 				`<div class="form-group" style="display:flex;flex-direction:column;align-items:center;gap:1em;margin-top:1em">
											<button type="button" name="confirmXP"> <i class="${ConfirmIcon}"></i> ${game.i18n.localize(ModuleName + ".Titles.confirmXP")} </button>
										</div>`;
										
		return vEntriesHTML + vButtonsHTML;
	}
	
	activateListeners(HTML) {
		const confirmButton = HTML.find(`button[name="confirmXP"]`);
		
		confirmButton.on("click", async () => {	await this.applyXP();
												console.log(xpThreshholdReached(this.actor));
												if (xpThreshholdReached(this.actor)) {
													new spendXPWindow(this.actor).render(true);
												}
												this.close();
		});
	}
	
	async applyXP() {
		let HTML = this.element;
		
		let gainedXP = 0;
		
		let entries = HTML.find(`div.XPoption`);
		
		let messageEntries = "";
		
		const settingKeys = Object.keys(defaultXPChoice);
		
		entries.each((number, element) => {
			let id = $(element).attr("name");
			
			if (id != "header") {
				messageEntries = messageEntries + `<div> <input type="checkbox" ${valueofInput($(element).find('input[type="checkbox"]')) ? "checked" : ""} disabled> <label>${$(element).find('label')[0].innerHTML}</label> </div>`;
				
				if (valueofInput($(element).find(`input[type="checkbox"]`))) {
					gainedXP = gainedXP + 1;
				}
			}
		});
		
		let targetvalue = this.actor.system.experience.value + gainedXP;
		
		await this.actor.update({system : {experience : {value : targetvalue}}});
		this.actor.setFlag(ModuleName, "levelup", false);
		
		let chatMessage = "<div>";
		chatMessage = chatMessage + `<label>${replacewords(game.i18n.localize(ModuleName + ".Messages.GainedXP"), {Actor : this.actor.name, XP : gainedXP})}</label>`;
		chatMessage = chatMessage + messageEntries;
		chatMessage = chatMessage + "</div>";
		await ChatMessage.create({user: game.user.id, content : chatMessage}); //CHAT MESSAGE
	}
}

class spendXPWindow extends Application {
	constructor(actor, Options = {}) {
		super(Options);
		
		this.actor = actor;
		
		if (!this.actor) {
			this.close();
			return;
		}
		
		this.xpavailable = this.actor.system.experience.value;
		if (this.xpavailable == null) {
			this.xpavailable = 0;
		}
		
		let skills = {};
		let skillincreases = {};
		let advancedskills = [];
		
		for (let key of Object.keys(this.actor.system.skills)) {
			skills[key] = this.actor.system.skills[key].value;
			skillincreases[key] = 0;
			if (this.actor.system.skills[key].category == "advanced") {
				advancedskills.push(key);
			}
		}
		
		this.originalSkills = skills;
		this.skillincreases = skillincreases;
		this.advancedskills = advancedskills;
		
		this.takenTalents = this.actor.items.filter(item => item.type == "talent");
		
		this.availableTalents = game.items.filter(item => item.visible && item.type == "talent" && !item.name.includes("_argonUI_")).filter(talent => !this.takenTalents.find(item => item.name == talent.name));
		this.chosenTalents = [];
		
		//this.renderState = {talentscroll : 0}
	}
	
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			popOut: true,
			width: 800,
			height: 500,
			template: `modules/${ModuleName}/templates/defaultwindow.html`,
			jQuery: true,
			title: game.i18n.localize(ModuleName + ".Titles." + "CharacterAdvancement"),
			resizable: true
		});
	}
	
	async getData(pOptions={}) {
		return {
			content: await this.getHTML(pOptions)
		};
	}
	
	async getHTML(pOptions={}) {
		let xp = this.xpavailable;
		let xpleft = await this.calculateXPleft();
		let skills = this.originalSkills;
		let skillincrease = this.skillincreases;
		//sort talents, chosen first
		let talents =  this.availableTalents.filter(talent => this.chosenTalents.find(entry => entry == talent.id)).concat(this.availableTalents.filter(talent => !this.chosenTalents.find(entry => entry == talent.id)));
		let chosenTalents = this.chosenTalents;
		
		let titleHTML = `<div style="margin-bottom:5px">`;
		
		let xpleftHTML = `<label style="color:${xpleft == xp ? "" : (xpleft >= Math.min(skillcost, talentcost) ? "grey" : "red")}">${xpleft}</label>`;
		
		titleHTML = titleHTML + `<h3>${replacewords(game.i18n.localize(ModuleName + ".Titles." + "XPAvailable"), {Actor : this.actor.name, XPmax : xp, XPleft : xpleftHTML})}</h3>`;
		
		titleHTML = titleHTML + `</div>`;
		
		let entriesHTML = `<div style="display:flex;height:calc(100% - 55px)">`;
		
		entriesHTML = entriesHTML + `<div style="display:flex;flex-direction:column;width:40%;height:100%" name="skills">`;
		
		for (const key of Object.keys(skills)) {
			entriesHTML = entriesHTML + 	`<div class="skillchoice" name="${key}" style="display:flex;margin-top:3px;margin-bottom:3px">
												<label style="width:50%">${this.advancedskills.includes(key) ? '<i class="fa-solid fa-star"></i>' : ""} ${game.i18n.localize(CONFIG.YZECORIOLIS.skills[key])}</label>
												<label style="width:25%;text-align:center;color:${skillincrease[key] > 0 ? "blue" : ""}">${skills[key] + skillincrease[key]}</label>
												<i class="fa-solid fa-minus" name="decrease" style="margin-right:5px;color:${skillincrease[key] - 1 >= 0 ? "" : "grey"}"></i>
												<i class="fa-solid fa-plus" style="color:${(skills[key] + skillincrease[key] + 1 <= skillmax) && (xpleft >= skillcost) ? "" : "grey"}" name="increase"></i>
											</div>`;
		}
		
		entriesHTML = entriesHTML + `</div>`;
		
		entriesHTML = entriesHTML + `<div style="display:flex;flex-direction:column;width:60%;right:0px;overflow-y:scroll;height:calc(100% - 5px)" name="talents">`;
		
		for (const talent of talents) {
			entriesHTML = entriesHTML + 	`<div class="talentchoice" name="${talent.id}" style="display:flex;margin-bottom:1px;border:${chosenTalents.find(entry => entry == talent.id) ? "2px solid" : ""}">
												<i src="${talent.img}" style="width:30px;height:30px;background-image:url(${talent.img});margin-right:5px;margin-top:3px;margin-bottom:3px"></i>
												<label style="width:50%;margin-top:8px;margin-bottom:3px">${talent.name}</label>
											</div>`;
		}
		
		entriesHTML = entriesHTML + `</div>`;
		
		entriesHTML = entriesHTML + `</div>`;
		
		//buttons	
		let buttonsHTML = 				`<div class="form-group" style="display:flex;flex-direction:column;align-items:center">
											<button type="button" name="confirmXP"> <i class="${ConfirmIcon}"></i> ${game.i18n.localize(ModuleName + ".Titles.confirmXP")}</button>
										</div>`;
										
		return titleHTML + entriesHTML + buttonsHTML;
	}
	
	activateListeners(HTML) {
		const confirmButton = HTML.find(`button[name="confirmXP"]`);
		
		confirmButton.on("click", () => {	
											this.applyChoices();
											this.close();
										});
		
		const SkillEntries = HTML.find(`div[name="skills"]`).find(`div.skillchoice`);
		
		for (let i = 0; i <= SkillEntries.length; i++) {
			let entry = $(SkillEntries[i]);
			
			let key = entry.attr("name");
			
			if (entry.length) {
				$(entry.find(`i[name="increase"]`))[0].onclick = () => {this.increaseSkill(key)};
				
				$(entry.find(`i[name="decrease"]`))[0].onclick = () => {this.decreaseSkill(key)};
			}
		}
		
		const TalentEntries = HTML.find(`div[name="talents"]`).find(`div.talentchoice`);
		
		for (let i = 0; i <= TalentEntries.length; i++) {
			let entry = $(TalentEntries[i]);
			
			let key = entry.attr("name");
			
			if (entry.length) {
				$(entry)[0].onclick = () => {this.toggleTalent(key)};
				$(entry)[0].onmouseenter = this._onTooltipMouseEnter.bind(this);
				$(entry)[0].onmouseleave = this._onTooltipMouseLeave.bind(this);
			}
		}
	}
	
    async _onTooltipMouseEnter(event) { //Taken from Argon CORE
        if(this._tooltip) this._tooltip._destroy();
		const item = this.availableTalents.find(talent => talent.id == $(event.fromElement).attr("name"));
        const tooltipData = await getTooltipDetails(item, this.actor.type);
        if (!tooltipData) return;
        this._tooltip = new CONFIG.ARGON.CORE.Tooltip(tooltipData, event.fromElement, null, false);
        this._tooltip.render();
    }

    async _onTooltipMouseLeave(event) { //Taken from Argon CORE
        if (!this._tooltip) return;
        this._tooltip._destroy();
        this._tooltip = null;
    }
	
	async increaseSkill(key) {
		if (await this.calculateXPleft() >= skillcost) {
			if (this.originalSkills[key] + this.skillincreases[key] + 1 <= skillmax) {
				this.skillincreases[key] = this.skillincreases[key] + 1;
				
				this.render();
			}
		}
	}
	
	async decreaseSkill(key) {
		if (this.skillincreases[key] - 1 >= 0) {
			this.skillincreases[key] = this.skillincreases[key] - 1;
			
			this.render();
		}
	}
	
	async toggleTalent(key) {
		let rerender = false;
		
		if (this.chosenTalents.includes(key)) {
				this.chosenTalents = this.chosenTalents.filter(entry => entry != key);
				rerender = true;
		}
		else {
			if (await this.calculateXPleft() >= talentcost) {
				this.chosenTalents.push(key);
				rerender = true;
			}
		}
	
		if (rerender) {
			this.render();
		}
	}
	
	async calculateXPused() {
		let xpused = 0;
		
		for (let key of Object.keys(this.skillincreases)) {
			xpused = xpused + this.skillincreases[key] * skillcost;
		}
		
		xpused = xpused + this.chosenTalents.length * talentcost;
		
		return xpused;
	}
	
	async calculateXPleft() {
		return this.xpavailable - (await this.calculateXPused());
	}
	
	async applyChoices() {
		if (await this.calculateXPleft() >= 0) {
			//talents
			let gainedtalents = this.availableTalents.filter(talent => this.chosenTalents.includes(talent.id)).map(talent => duplicate(talent));
			
			this.actor.createEmbeddedDocuments("Item", gainedtalents);
			
			//skills
			let skillupdates = {system : {skills : {}}};
			for (let key of Object.keys(this.skillincreases)) {
				skillupdates.system.skills[key] = {value : this.originalSkills[key] + this.skillincreases[key]};
			}
			
			this.actor.update(skillupdates);
			
			//XP
			this.actor.update({system : {experience : {value : this.actor.system.experience.value - (await this.calculateXPused())}}});
		}
	}
	
	render(...args) {
		super.render(...args);
	}
}

function xpThreshholdReached(actor) {
	return actor.system.experience.value >= Math.min(skillcost, talentcost);
}

function valueofInput(input) {
	if (input) {
		switch (input.prop("type")) {
			case "checkbox":
				return input.prop("checked");
				break;
			default:
				return input.val();
				break;
		}
	}
} 

function fixXPoptionSetting(setting) {
	defaultXPChoice = {
		Name : game.i18n.localize(ModuleName + ".Titles.defaultXPOption.name")
	}

	let options = game.settings.get(ModuleName, setting);
	
	for (let key of Object.keys(options)) {
		for (let settingkey of Object.keys(defaultXPChoice)) {
			if (!options[key].hasOwnProperty(settingkey)) {
				options[key][settingkey] = defaultXPChoice[settingkey];
			}
		}
	}
	
	game.settings.set(ModuleName, setting, options);
}

//ui
function addBuilderButton(app, html, infos) {
	if (game.user.isGM) {
		const xpbutton = document.createElement("li");
		xpbutton.classList.add("control-tool");
		xpbutton.setAttribute("data-tool", "levelup");
		xpbutton.setAttribute("data-tooltip", game.i18n.localize(ModuleName+".Titles.LevelUP"));
		
		const icon = document.createElement("i");
		icon.classList.add("fa-solid", "fa-arrow-up");
		
		xpbutton.appendChild(icon);
		
		xpbutton.onclick = () => {game.socket.emit("module." + ModuleName, {functionname : "levelup", data : {}});}

		ui.controls.element[0].querySelector('[id="tools-panel-token"]').lastElementChild.after(xpbutton);
	}
}

Hooks.once("ready", () => {
	game.socket.on("module." + ModuleName, async ({functionname, data} = {}) => {
		switch(functionname) {
			case "levelup": 
				game.user.character.setFlag(ModuleName, "levelup", true);
				break;
		}
	});
});

Hooks.on("renderSceneControls", (app, html, infos) => {
	if (game.settings.get(ModuleName, "useXPautomation")) {
		addBuilderButton(app, html, infos);
	}
});

export {fixXPoptionSetting, XPOptionsSettingWindow, gainXPWindow, spendXPWindow, xpThreshholdReached};