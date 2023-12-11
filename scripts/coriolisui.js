import {registerCORIOLISECHSItems, CORIOLISECHActionItems, CORIOLISECHFreeActionItems} from "./specialItems.js";
import {ModuleName, SystemName, getTooltipDetails, openRollDialoge, openItemRollDialoge, firstUpperCase} from "./utils.js";
import {openNewInput} from "./popupInput.js";

const talenttypes = ["group", "icon", "general", "humanite", "cybernetic", "bionicsculpt", "mysticalpowers"];

Hooks.on("argonInit", (CoreHUD) => {
    const ARGON = CoreHUD.ARGON;
  
	registerCORIOLISECHSItems();
  
	function consumeAction(amount) {
		if (ui.ARGON.components.main[0].currentActions >= amount) {
			ui.ARGON.components.main[0].currentActions = ui.ARGON.components.main[0].currentActions - amount;
			return true;
		}
		
		return false;
	}
  
    class CORIOLISPortraitPanel extends ARGON.PORTRAIT.PortraitPanel {
		constructor(...args) {
			super(...args);
			
			this.usedArmor = undefined;
			
			Hooks.on("updateItem", (item, changes, infos, userid) => {
				if (item.actor == this.actor) {
					if (changes?.system?.hasOwnProperty("equipped")) {
						this.render();
					}
				}
			});
			
			this.wasDead = {};
		}

		get description() {
			return `${this.actor.system.bio.concept}`;
		}

		get isDead() {
			let isDead = {};
			
			for (const key of ["hitPoints", "mindPoints"]) {
				isDead[key] = (this.actor.system[key].value <= 0 && this.actor.system[key].max > 0);
			}
			
			if (game.settings.get(ModuleName, "AutoRollInjuries")) {
				if (isDead.hitPoints && !isDead.mindPoints) {
					CORIOLISPortraitPanel.rollInjuries();
				}
			}
			
			this.wasDead = isDead;
			
			return Object.values(isDead).find(value => value);
		}

		async getStatBlocks() {
			let ActiveArmor = canvas.tokens.controlled[0].actor.items.filter(item => item.type == "armor" && item.system.equipped);
			
			let ArmorValue = -1;
			this.usedArmor = undefined;
			
			ActiveArmor.forEach((armoritem) => {if (armoritem.system.armorRating > ArmorValue) {ArmorValue = armoritem.system.armorRating; this.usedArmor = armoritem;}});
			
			let Blocks = [];
			
			if ( this.usedArmor) {
				Blocks.push([
					{
						text: game.i18n.localize( this.usedArmor.name),
						id: "armorStat"
					},
					{
						text:  this.usedArmor.system.armorRating,
						color: "var(--ech-movement-baseMovement-background)",
					},
				]);
			}
			
			return Blocks;
		}
		
		async getResourceBars() {
			const size = 12;
			
			let bars = {left : [], right : []};
			
			for (let bartype of ["hitPoints", "mindPoints", "radiation"]) {
				let side;
				let fillcolor;
				
				switch (bartype) {
					case "hitPoints":
						side = "left";
						fillcolor = "#125c00";
						break;
					case "mindPoints":
						side = "left";
						fillcolor = "#3f82a7"
						break;
					case "radiation":
						side = "right";
						fillcolor = "#b1c343"
						break;
				}
				
				if (!(bartype == "radiation") || this.actor.system[bartype].value > 0) {
					let html = `<div class="bar" style="display:flex;flex-direction:column-reverse;border:1px solid #a4a4a4;padding:0px 5px 0px 5px;background-color:rgba(113, 130, 190, 0.35);border-radius:2px">`;
					
					for (let i = 1; i <= this.actor.system[bartype].max; i++) {
						html = html + `<div id="${bartype}-${i}" style="background-color:${i<=this.actor.system[bartype].value ? fillcolor : "#000000"};width:${1.6 * size}px;height:${size}px;margin-top:1.75px;margin-right:1px;margin-bottom:1.75px;margin-left:1px;border-radius:2px"></div>`;
					}
					
					html = html + `</div>`;
						
					bars[side].push(html);
				}
			}
			/*
			let rot = this.actor.system.rot;
			
			for (let i = 0; i < (rot.value + rot.permanent); i++) {
				let permanent = i < rot.permanent;
				
				let description = rot.label;
				
				if (permanent) {
					description = "CORIOLIS.PERMA_ROT";
				}
				
				Icons.push({img : "systems/mutant-year-zero/ui/dice-base-1.png", description : description, key : "rot", click : () => {}, border : permanent});
			}
			*/
						
			return bars;
		}
		
		async _renderInner(data) {
			await super._renderInner(data);
			
			const armorBlock = this.element.querySelector("#armorStat")?.parentElement;

			if (armorBlock) {
				armorBlock.onclick = () => {openItemRollDialoge(this.usedArmor, this.actor)};
			}
			
			const ResourceBars = await this.getResourceBars();
			for (const side of Object.keys(ResourceBars)) {
				const Bars = document.createElement("div");
				
				Bars.style = `display:flex;position:absolute;${side}:0px;flex-direction:row`;
				
				for (let i = 0; i < ResourceBars[side].length; i++) {
					Bars.innerHTML = Bars.innerHTML + ResourceBars[side][i];
				}
				
				for (const Bar of Bars.children) {
					for (const BarElement of Bar.children) {
						let id = BarElement.id;
						BarElement.onclick = () => {this.onResourceBarClick(id)}
					}
				}
				
				this.element.appendChild(Bars);
			}
					
			this.element.querySelector(".player-buttons").style.right = "0%";
		}
		
		async onResourceBarClick(id) {
			let resourceType = id.split("-")[0];
			let resourceValue = id.split("-")[1];
			
			if (this.actor.system[resourceType]) {
				if (this.actor.system[resourceType].value == resourceValue) {
					await CORIOLISPortraitPanel.setResource(this.actor, resourceType, resourceValue-1);
				}
				else {
					await CORIOLISPortraitPanel.setResource(this.actor, resourceType, resourceValue);
				}
			}
			
		}
		
		static async setResource(actor, resourceType, value) {
			if (actor && actor.system[resourceType]) {
				await actor.update({system : {[resourceType] : {value : value}}})
			}
		}	
		
		static async rollInjuries() {
			let table = await fromUuid("RollTable." + game.settings.get(ModuleName, "InjurieTable"));
			if (table) {
				table.draw({roll: true, displayChat: true});
			}
		}
	}
	
	class CORIOLISDrawerPanel extends ARGON.DRAWER.DrawerPanel {
		constructor(...args) {
			super(...args);
		}

		get categories() {
			const attributes = {...this.actor.system.attributes};
			const actorskills = this.actor.system.skills;
			let skills = {};
			skills.general = Object.keys(actorskills).filter(skillkey => actorskills[skillkey].category == "general").map(skillkey => {return {key : skillkey, ...actorskills[skillkey]}});
			skills.advanced = Object.keys(actorskills).filter(skillkey => actorskills[skillkey].category == "advanced").map(skillkey => {return {key : skillkey, ...actorskills[skillkey]}});
			
			
			let maxAttribute = Math.max(...Object.values(attributes).map(content => content.value));

			const attributesButtons = Object.keys(attributes).map((attribute) => {
				const attributeData = attributes[attribute];
				
				let valueLabel = attributeData.value;
				
				if (game.settings.get(ModuleName, "UseDiceCircles")) {
					valueLabel = "";
					
					valueLabel = valueLabel + `<div style="display:flex">`;
					
					valueLabel = valueLabel + "</div>";
					
					valueLabel = valueLabel + `<div style="display:flex">`;
					
					for (let i = 0; i < attributeData.value; i++) {
						valueLabel = valueLabel + `<i class="fa-regular fa-circle"></i>`;
					}
					
					valueLabel = valueLabel + "</div>";
				}
				
				return new ARGON.DRAWER.DrawerButton([
					{
						label: game.i18n.localize(SystemName + ".Attr" + firstUpperCase(attribute)),
						onClick: () => {openRollDialoge("attribute", attribute, this.actor)}
					},
					{
						label: valueLabel,
						onClick: () => {openRollDialoge("attribute", attribute, this.actor)},
						style: "display: flex; justify-content: flex-end;"
					}
				]);
			});
			
			let skillsButtons = {};

			for (const skilltype of ["general", "advanced"]) {
				skillsButtons[skilltype] = skills[skilltype].map((skill) => {
					if (skilltype == "general" || skill.value > 0) {
						//only show advanced skills with at least one point
						let valueLabel = `${skill.value}<span style="margin: 0 1rem; filter: brightness(0.8)">(+${attributes[skill.attribute].value})</span>`;
						
						if (game.settings.get(ModuleName, "UseDiceCircles")) {
							valueLabel = "";
							
							valueLabel = valueLabel + `<div style="display:flex">`;
							
							for (let i = 0; i < skill.value; i++) {
								valueLabel = valueLabel + `<i class="fa-solid fa-circle"></i>`;
							}
							
							valueLabel = valueLabel + "</div>";
							
							valueLabel = valueLabel + `<div style="display:flex">`;
							
							for (let i = 0; i < maxAttribute; i++) {
								if (i < attributes[skill.attribute].value) {
									valueLabel = valueLabel + `<i class="fa-regular fa-circle"></i>`;
								}
								else {
									valueLabel = valueLabel + `<i class="fa-regular fa-circle" style="visibility:hidden"></i>`;
								}
							}
							
							valueLabel = valueLabel + "</div>";
						}
						
						let skilltranslationid = firstUpperCase(skill.key);
						
						switch (skill.key) {
							case "meleecombat":
								skilltranslationid = "MeleeCombat";
								break;
							case "rangedcombat":
								skilltranslationid = "RangedCombat";
								break;
							case "datadjinn":
								skilltranslationid = "DataDjinn";
								break;
							case "mysticpowers":
								skilltranslationid = "MysticPowers";
								break;
						}
						
						return new ARGON.DRAWER.DrawerButton([
							{
								label: game.i18n.localize(SystemName + ".Skill" + skilltranslationid),
								onClick: () => {openRollDialoge("skill", skill.key, this.actor)}
							},
							{
								label: valueLabel,
								onClick: () => {openRollDialoge("skill", skill.key, this.actor)},
								style: "display: flex; justify-content: flex-end;"
							},
						]);
					}
				}).filter(button => button);
			}

			let returncategories = [];

			if (attributesButtons.length) {
				if (!game.settings.get(ModuleName, "UseDiceCircles")) {
					returncategories.push({
						gridCols: "7fr 2fr 2fr",
						captions: [
							{
								label: game.i18n.localize(SystemName+".Attributes"),
							},
							{
								label: "", //looks nicer
							},
							{
								label: game.i18n.localize(ModuleName+".Titles.ROLL"),
							},
						],
						buttons: attributesButtons
					});
				}
				else {
					returncategories.push({
						gridCols: "7fr 2fr",
						captions: [
							{
								label: game.i18n.localize(SystemName+".Attributes"),
							},
							{
								label: game.i18n.localize(ModuleName+".Titles.ROLL"),
							},
						],
						buttons: attributesButtons
					});
				}
			}
			
			for (let skilltype of ["general", "advanced"]) {
				if (skillsButtons[skilltype].length) {
					returncategories.push({
						gridCols: "7fr 2fr",
						captions: [
							{
								label: game.i18n.localize(SystemName+".SkillCat" + firstUpperCase(skilltype)),
							},
							{
								label: "",
							}
						],
						buttons: skillsButtons[skilltype],
					});
				}
			}
			
			return returncategories;
		}

		get title() {
			return `${game.i18n.localize(SystemName+".Attributes")} & ${game.i18n.localize(ModuleName+".Titles.Skills")}`;
		}
	}
  
    class CORIOLISActionActionPanel extends ARGON.MAIN.ActionPanel {
		constructor(...args) {
			super(...args);
			
			this.actionsLeft = this.maxActions;
		}

		get label() {
			return ModuleName+".Titles.ActionAction";
		}
		
		get maxActions() {
            return 3;
        }
		
		get currentActions() {
			return this.actionsLeft;
		}
		
		set currentActions(value) {
			this.actionsLeft = value;
			this.updateActionUse();
		}
		
		_onNewRound(combat) {
			this.actionsLeft = this.maxActions;
			this.updateActionUse();
		}
		
		async _getButtons() {
			const specialActions = Object.values(CORIOLISECHActionItems);

			let buttons = [];
			
			let talentbuttons = [];
			let generalBlacklist = [];
			const talentsThreshold = game.settings.get(ModuleName, "TalentsThreshold");
			
			let talents = this.actor.items.filter(item => item.type == "talent");
			
			for (const subtype of talenttypes.filter(type => type != "general")) {
				if (talents.filter(item => item.system.category == subtype).length >= talentsThreshold) {
					talentbuttons.push(new CORIOLISButtonPanelButton({type: "talent", subtype: subtype, color: 0}));
					generalBlacklist.push(subtype);
				}
			}
			
			if (talents.find(item => !generalBlacklist.includes(item.system.category))) {
				talentbuttons.unshift(new CORIOLISButtonPanelButton({type: "talent", subtype: "general", color: 0, typeblacklist : generalBlacklist}));
			}
			
			buttons.push(new CORIOLISItemButton({ item: null, isWeaponSet: true, isPrimary: true }));
			buttons.push(new ARGON.MAIN.BUTTONS.SplitButton(new CORIOLISSpecialActionButton(specialActions[0]), new CORIOLISSpecialActionButton(specialActions[1])));
			buttons.push(...talentbuttons);
			buttons.push(new CORIOLISButtonPanelButton({type: "gear", color: 0}));
			buttons.push(new ARGON.MAIN.BUTTONS.SplitButton(new CORIOLISSpecialActionButton(specialActions[2]), new CORIOLISSpecialActionButton(specialActions[3])));
			buttons.push(new ARGON.MAIN.BUTTONS.SplitButton(new CORIOLISSpecialActionButton(specialActions[4]), new CORIOLISSpecialActionButton(specialActions[5])));
			buttons.push(new ARGON.MAIN.BUTTONS.SplitButton(new CORIOLISSpecialActionButton(specialActions[6]), new CORIOLISSpecialActionButton(specialActions[7])));
			buttons.push(new ARGON.MAIN.BUTTONS.SplitButton(new CORIOLISSpecialActionButton(specialActions[8]), new CORIOLISSpecialActionButton(specialActions[9])));
			
			return buttons.filter(button => button.items == undefined || button.items.length);
		}
    }
	
    class CORIOLISFreeActionPanel extends ARGON.MAIN.ActionPanel {
		constructor(...args) {
			super(...args);
		}

		get label() {
			return ModuleName+".Titles.FreeAction";
		}
		
		async _getButtons() {
			const specialActions = Object.values(CORIOLISECHFreeActionItems);

			const buttons = [
				new CORIOLISSpecialActionButton(specialActions[0])
			];
			return buttons.filter(button => button.items == undefined || button.items.length);
		}
    }
	
	class CORIOLISItemButton extends ARGON.MAIN.BUTTONS.ItemButton {
		constructor(...args) {
			super(...args);
			
			if (this.item?.type == "weapon") {
				Hooks.on("updateActor", (actor, changes, infos, sender) => {
					if (this.quantity != null) {
						if (this.actor == actor) {
							this.render();
						}
					}
				});
			}
		}

		get hasTooltip() {
			return true;
		}

		get targets() {
			return null;
		}

		async getTooltipData() {
			const tooltipData = await getTooltipDetails(this.item, this.actor.system.creatureType);
			return tooltipData;
		}
		
		async _onTooltipMouseEnter(event) {
			const tooltipData = await this.getTooltipData();
			if (!tooltipData) return;
			this._tooltip = new CORIOLISTooltip(tooltipData, this.element, this.tooltipOrientation);
			this._tooltip.render();
		}

		get quantity() {
			return null;
		}
		
		async _onLeftClick(event, special = "") {
			if (!(event.target.id != "specialAction" || special)) return;
			
			var used = false;
			
			if (this.item.type == "weapon") {
				used = true;
				
				let modifier = 0;
				
				switch (special) {
					case "aimed":
						modifier = 2;
						break;
					case "quick":
						modifier = -2;
						break;
				}
				
				if (used) {
					openItemRollDialoge(this.item, this.actor, {modifier : modifier});
				}
			}
			
			if (this.item.type == "gear") {
				this.item.sendToChat();
				
				used = true;
			}		
			
			if (this.item.type == "talent") {
				this.item.sendToChat();
			}
			
			if (used) {
				CORIOLISItemButton.consumeActionEconomy(this.item, special);
			}
		}
		
		async specialOptions() {
			let Options = [];
			
			if (game.settings.get(ModuleName, "ShowAimedQuick")) {
				if (this.item.type == "weapon") {
					if (!this.item.system.melee) {
						Options.push({
							text : game.i18n.localize(ModuleName+".Titles.AimedShot"),
							special : "aimed"
						});
						
						Options.push({
							text : game.i18n.localize(ModuleName+".Titles.QuickShot"),
							special : "quick"
						});
					}	
				}
			}
			
			return Options;
		}
		
		async _onTooltipMouseEnter(event) {
			await super._onTooltipMouseEnter(event);
			
			if (this.element.querySelector("#specialAction")) {
				this.element.querySelector("#maintitle").style.visibility = "hidden";
				for (const specialelement of this.element.querySelectorAll("#specialAction")) {
					specialelement.style.visibility = "";
				}
			}
		}

		async _onTooltipMouseLeave(event) {
			await super._onTooltipMouseLeave(event);
			
			if (this.element.querySelector("#maintitle")) {
				this.element.querySelector("#maintitle").style.visibility = "";
				for (const specialelement of this.element.querySelectorAll("#specialAction")) {
					specialelement.style.visibility = "hidden";
				}
			}
		}
	
		async _renderInner(data) {
			await super._renderInner(data);
			
			const specialActions = await this.specialOptions();
			if (specialActions.length > 0) {
				this.element.querySelector("span").id = "maintitle";
				
				for (let i = 0; i < specialActions.length; i++) {
					let Action = specialActions[i];
					let ActionTitle = document.createElement("span");
					ActionTitle.id = "specialAction";
					ActionTitle.classList.add("action-element-title");
					ActionTitle.innerHTML = Action.text;
					ActionTitle.onclick = (event) => {event.stopPropagation(); event.preventDefault(); this._onLeftClick(event, Action.special)};
					ActionTitle.style.visibility = "hidden";
					
					ActionTitle.style.width = `${100/specialActions.length}%`;
					ActionTitle.style.left = `${i * 100/specialActions.length}%`;
					
					ActionTitle.onmouseenter = () => {ActionTitle.style.filter = "brightness(66%)"}
					ActionTitle.onmouseleave = () => {ActionTitle.style.filter = ""}
					
					this.element.appendChild(ActionTitle);
				}
			}
		}

		static consumeActionEconomy(item, special = "") {
			let consumeID = undefined;
			
			if (item.type == "weapon") {
				switch (special) {
					case "aimed":
						consumeAction(3);
						break;
					case "quick":
						consumeAction(1);
						break;
					default:
						consumeAction(2);
						break;
				}
			}
		}
	}
  
    class CORIOLISButtonPanelButton extends ARGON.MAIN.BUTTONS.ButtonPanelButton {
		constructor({type, subtype, color, typeblacklist = []}) {
			super();
			this.type = type;
			this.color = color;
			this.subtype = subtype;
			this.typeblacklist = typeblacklist;
		}

		get colorScheme() {
			return this.color;
		}

		get label() {
			switch (this.type) {
				case "gear": return SystemName+".Gear";
				case "talent": 
					switch(this.subtype) {
						case "group" : return SystemName+".TalentCatGroup";
						case "icon" : return SystemName+".TalentCatIcon";
						case "general" : return SystemName+".SheetTalents";
						case "humanite" : return SystemName+".TalentCatHumanite";
						case "cybernetic" : return SystemName+".TalentCatCybernetic";
						case "bionicsculpt" : return SystemName+".TalentCatBionicSculpt";
						case "mysticalpowers" :return SystemName+".TalentCatMysticalPowers"
						default : return SystemName+".SheetTalents";
					}
			}
		}

		get icon() {
			switch (this.type) {
				case "gear": return "modules/enhancedcombathud/icons/svg/backpack.svg";
				case "talent": 
					switch(this.subtype) {
						case "group" : return "modules/enhancedcombathud-yzecoriolis/icons/team-upgrade.svg";
						case "icon" : return "modules/enhancedcombathud-yzecoriolis/icons/psychic-waves.svg";
						case "general" : return "icons/svg/book.svg";
						case "humanite" : return "modules/enhancedcombathud-yzecoriolis/icons/alien-stare.svg";
						case "cybernetic" : return "modules/enhancedcombathud-yzecoriolis/icons/cyborg-face.svg";
						case "bionicsculpt" : return "modules/enhancedcombathud-yzecoriolis/icons/techno-heart.svg";
						case "mysticalpowers" :return "modules/enhancedcombathud-yzecoriolis/icons/glowing-artifact.svg"
						default : return "icons/svg/book.svg";
					}
			}
		}
		
		async _getPanel() {
			let validitems = this.actor.items.filter(item => item.type == this.type);
			
			if (this.type = "talent") {
				switch (this.subtype) {
					case "general" :
						validitems = validitems.filter(item => !(this.typeblacklist.includes(item.system.category)));
						break;
					default :
						validitems = validitems.filter(item => item.system.category == this.subtype);
						break;
				}
			}
			
			return new ARGON.MAIN.BUTTON_PANELS.ButtonPanel({buttons: validitems.map(item => new CORIOLISItemButton({item}))});
		}
    }
	
	class CORIOLISSpecialActionButton extends ARGON.MAIN.BUTTONS.ActionButton {
        constructor(specialItem) {
			super();
			this.item = new CONFIG.Item.documentClass(specialItem, {
				parent: this.actor,
			});
		}

		get label() {
			return this.item.name;
		}

		get icon() {
			return this.item.img;
		}

		get hasTooltip() {
			return true;
		}
		
		get colorScheme() {
			return 3 - this.item.flags[ModuleName].APconsumption;
		}

		async getTooltipData() {
			const tooltipData = await getTooltipDetails(this.item, this.actor.system.creatureType);
			return tooltipData;
		}
		
		async _onTooltipMouseEnter(event) {
			const tooltipData = await this.getTooltipData();
			if (!tooltipData) return;
			this._tooltip = new CORIOLISTooltip(tooltipData, this.element, this.tooltipOrientation);
			this._tooltip.render();
		}
		
		async _onLeftClick(event) {
			var used = true;
			
			const item = this.item;
			
			if (this.item.system.skill) {
				if (this.actor.system.creatureType == "robot") {
					openRollDialoge("skill", this.item.system.skillRobot, this.actor);
				}
				else {
					openRollDialoge("skill", this.item.system.skill, this.actor);
				}
			}
			
			if (used) {
				CORIOLISSpecialActionButton.consumeActionEconomy(this.item);
			}
		}

		static consumeActionEconomy(item) {
			consumeAction(item.flags[ModuleName].APconsumption);
		}
    }
	
	class CORIOLISMovementHud extends ARGON.MovementHud {

		constructor (...args) {
			super(...args);
			
			this.prevUsedMovement = 0;
		}

		get movementMax() {
			return this.actor.system.movementRate / canvas.scene.dimensions.distance;
		}
		
		get movementUsed() {
			return this._movementUsed;
		}
		
		set movementUsed(value) {
			super._movementUsed = value;
			
			consumeAction(Math.ceil(value/this.movementMax) - Math.ceil(this.prevUsedMovement/this.movementMax));
			
			this.prevUsedMovement = value;
		}
		
	    _onNewRound(combat) {
			super._onNewRound(combat);
			
			this.prevUsedMovement = 0;
	    }
	}
	
	class CORIOLISWeaponSets extends ARGON.WeaponSets {
		constructor(...args) {
			super(...args);
			
			this.lastdragID = "";
			/*
			Hooks.on("renderActorSheet", (sheet, html, infos) => {
				if (sheet.actor == this.actor) {
					const weaponelements = html.find(`li .roll-weapon`);
					
					weaponelements.each((i, element) => {
						element.draggable = true;
						
						let id = element.getAttribute("data-item-id");
						
						element.ondragstart = () => {
							this.lastdragID = id;
						};
						
						element.ondragend = () => {
							if (this.lastdragID == id) {
								this.lastdragID = "";
							}
						};
					})
				}
			});
			*/
		}
		
		async getDefaultSets() {
			let attacks = this.actor.items.filter((item) => item.type === "weapon");
			
			return {
				1: {
					primary: attacks[0]?.id ?? null,
					secondary: null,
				},
				2: {
					primary: attacks[1]?.id ?? null,
					secondary: null,
				},
				3: {
					primary: attacks[2]?.id ?? null,
					secondary: null,
				},
			};
		}

		async _onSetChange({sets, active}) {
			const updates = [];
			const activeSet = sets[active];
			const activeItems = Object.values(activeSet).filter((item) => item);
			const inactiveSets = Object.values(sets).filter((set) => set !== activeSet);
			const inactiveItems = inactiveSets.flatMap((set) => Object.values(set)).filter((item) => item);
			activeItems.forEach((item) => {
				if(!item.system?.equipped) updates.push({_id: item.id, "system.equipped": true});
			});
			inactiveItems.forEach((item) => {
				if(item.system?.equipped) updates.push({_id: item.id, "system.equipped": false});
			});
			return await this.actor.updateEmbeddedDocuments("Item", updates);
		}

		async _getSets() { //overwrite because slots.primary/secondary contains id, not uuid
			const sets = mergeObject(await this.getDefaultSets(), deepClone(this.actor.getFlag("enhancedcombathud", "weaponSets") || {}));

			for (const [set, slots] of Object.entries(sets)) {
				slots.primary = slots.primary ? await this.actor.items.get(slots.primary) : null;
				slots.secondary = null;
			}
			return sets;
		}
		
		async _onDrop(event) {
			try {      
				event.preventDefault();
				event.stopPropagation();
				const data = JSON.parse(event.dataTransfer.getData("text/plain"));
				const item = await fromUuid(data.uuid);
				if(item?.type != "weapon") return;
				const set = event.currentTarget.dataset.set;
				const slot = event.currentTarget.dataset.slot;
				const sets = this.actor.getFlag("enhancedcombathud", "weaponSets") || {};
				sets[set] = sets[set] || {};
				sets[set][slot] = item.id;
				await this.actor.setFlag("enhancedcombathud", "weaponSets", sets);
				await this.render();
			} catch (error) {
				
			}
		}
		
		get template() {
			return `modules/${ModuleName}/templates/coriolisWeaponSets.hbs`;
		}
		
		async getactiveSet() {
			const sets = await this._getSets();
			return sets[this.actor.getFlag("enhancedcombathud", "activeWeaponSet")];
		}
    }
	
	class CORIOLISTooltip extends ARGON.CORE.Tooltip {
		get template() {
			return `modules/${ModuleName}/templates/coriolisTooltip.hbs`; //to add color to subtitles
		}
	}
  
    /*
    class CORIOLISEquipmentButton extends ARGON.MAIN.BUTTONS.EquipmentButton {
		constructor(...args) {
			super(...args);
		}
    }
	*/
  
    CoreHUD.definePortraitPanel(CORIOLISPortraitPanel);
    CoreHUD.defineDrawerPanel(CORIOLISDrawerPanel);
    CoreHUD.defineMainPanels([
		CORIOLISActionActionPanel,
		CORIOLISFreeActionPanel,
		ARGON.PREFAB.PassTurnPanel
    ]);  
	CoreHUD.defineMovementHud(null);
	CoreHUD.defineMovementHud(CORIOLISMovementHud);
    CoreHUD.defineWeaponSets(CORIOLISWeaponSets);
	CoreHUD.defineSupportedActorTypes(["character", "npc", "ship"]);
});
