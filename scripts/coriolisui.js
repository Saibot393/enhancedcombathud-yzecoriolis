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
			
			Hooks.on("updateItem", (item, changes, infos, userid) => {
				if (item.actor == this.actor) {
					if (changes?.system?.hasOwnProperty("equipped")) {
						this.render();
					}
				}
			});
		}

		get description() {
			return `${this.actor.system.bio.concept}`;
		}

		get isDead() {
			return ((this.actor.system.hitPoints.value <= 0 && this.actor.system.hitPoints.max > 0) || (this.actor.system.mindPoints.value <= 0 && this.actor.system.mindPoints.max > 0));
		}

		async getStatBlocks() {
			let ActiveArmor = canvas.tokens.controlled[0].actor.items.filter(item => item.type == "armor" && item.system.equipped);
			
			let ArmorValue = 0;
			let usedArmor = undefined;
			
			ActiveArmor.forEach((armoritem) => {if (armoritem.system.armorRating > ArmorValue) {ArmorValue = armoritem.system.armorRating; usedArmor = armoritem;}});
			
			let Blocks = [];
			
			if (usedArmor) {
				Blocks.push([
					{
						text: game.i18n.localize(usedArmor.name),
					},
					{
						text: usedArmor.system.armorRating,
						color: "var(--ech-movement-baseMovement-background)",
					},
				]);
			}
			
			return Blocks;
		}
		
		async getConditionBars() {
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
						html = html + `<div style="background-color:${i<=this.actor.system[bartype].value ? fillcolor : "#000000"};width:${1.6 * size}px;height:${size}px;margin-top:1.75px;margin-right:1px;margin-bottom:1.75px;margin-left:1px;border-radius:2px"></div>`;
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
			
			const ConditionBars = await this.getConditionBars();
			
			for (const side of Object.keys(ConditionBars)) {
				const Bar = document.createElement("div");
				
				Bar.style = `display:flex;position:absolute;${side}:0px;flex-direction:row`;
				
				for (let i = 0; i < ConditionBars[side].length; i++) {
					Bar.innerHTML = Bar.innerHTML + ConditionBars[side][i];
				}
				
				this.element.appendChild(Bar);
			}
					
			this.element.querySelector(".player-buttons").style.right = "0%";
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
		
		async _onLeftClick(event) {
			var used = false;
			
			if (this.item.type == "weapon") {
				used = true;
				
				if (used) {
					openItemRollDialoge(this.item, this.actor);
				}
			}
			
			if (this.item.type == "gear") {
				this.item.sendToChat();
				
				used = true;
			}		
			
			if (this.item.type == "talent") {
				this.item.sendToChat();
			}

			if (this.item.type == "ability") {
				if (game.settings.get(ModuleName, "ConsumeResourcePoints")) {
					let consumeamount = 1;
					
					if (game.settings.get(ModuleName, "AskResourcePointAmount")) {
						consumeamount = await openNewInput("number", game.i18n.localize(ModuleName+"Titles.ResourceConsume"), game.i18n.localize(ModuleName+"Titles.HowmanyResources"), {defaultValue : 1});
					}
					
					const newvalue = this.actor.system.resource_points.value - consumeamount;
					
					if (newvalue >= 0) {
						this.actor.update({system : {resource_points : {value : newvalue}}});
						
						used = true;
					}
				}
				else {
					used = true;
				}
				
				if (used) {
					this.item.sendToChat();
				}
			}
			
			if (used) {
				CORIOLISItemButton.consumeActionEconomy(this.item);
			}
		}

		static consumeActionEconomy(item) {
			let consumeID = undefined;
			
			if (item.type == "weapon") {
				consumeAction("action");
			}
			
			if (item.type == "gear") {
				consumeAction("maneuver");
			}
			
			if (item.type == "ability") {
				consumeAction(this.abilityactiontype(item));
			}
		}
		
		static abilityactiontype(item) {
			if (item.system.description.includes("(R)")) {
				return "react";
			}
			
			if (item.system.description.includes("(E)")) {
				return "";
			}
			
			return "action";
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