import {registerCORIOLISECHSItems, CORIOLISECHActionItems, CORIOLISECHManeuverItems, CORIOLISECHReactionItems} from "./specialItems.js";
import {ModuleName, getTooltipDetails, openRollDialoge} from "./utils.js";
import {openNewInput} from "./popupInput.js";

Hooks.on("argonInit", (CoreHUD) => {
    const ARGON = CoreHUD.ARGON;
  
	registerCORIOLISECHSItems();
  
	function consumeAction(type) {
		switch (type) {
			case "action":
				ui.ARGON.components.main[0].isActionUsed = true;
				ui.ARGON.components.main[0].updateActionUse();
				break;
			case "maneuver":
				if (ui.ARGON.components.main[1].isActionUsed) {
					ui.ARGON.components.main[0].isActionUsed = true;
					ui.ARGON.components.main[0].updateActionUse();
				}
				else {
					ui.ARGON.components.main[1].isActionUsed = true;
					ui.ARGON.components.main[1].updateActionUse()
				}
				break;
			case "react":
				consumeAction("action");
				break;
		}
	}
  
    class CORIOLISPortraitPanel extends ARGON.PORTRAIT.PortraitPanel {
		constructor(...args) {
			super(...args);
		}

		get description() {
			const { system } = this.actor;
			
			return `${system.role}, ${system.rank}`;
		}

		get isDead() {
			return Object.values(this.actor.system.attributes).find(attribute => attribute.value <= 0 && attribute.max > 0);
		}

		async getStatBlocks() {
			let ActiveArmor = canvas.tokens.controlled[0].actor.items.filter(item => item.type == "armor" && item.system.equipped);
			
			let ArmorValue = 0;
			
			ActiveArmor.forEach(armoritem => ArmorValue = ArmorValue + armoritem.system.armorRating)
			
			if (ArmorValue > 0) {
				ActiveArmor = ArmorValue;			
			}
			
			let Blocks = [];
			
			if (ActiveArmor) {
				Blocks.push([
					{
						text: game.i18n.localize(ActiveArmor.label),
					},
					{
						text: ActiveArmor.value,
						color: "var(--ech-movement-baseMovement-background)",
					},
				]);
			}
			
			return Blocks;
		}
		
		async getsideStatBlocks() {
			let attributes = this.actor.system.attributes;
			
			let Blocks = {left : [], right : []};
			
			for (let key of Object.keys(attributes)) {
				if (attributes[key].value < attributes[key].max || key == "strength") {
					let position = "";
					
					switch(key) {
						case "agility" :
						case "strength":
							position = "left";
							break;
						case "empathy" :
						case "wits":
							position = "right";
							break;
					}
					
					Blocks[position].unshift([
						{
							text: game.i18n.localize(`CORIOLIS.ATTRIBUTE_${key.toUpperCase()}`).toUpperCase().slice(0,3),
						},
						{
							text: attributes[key].value,
						},
						{
							text: "/",
						},
						{
							text: attributes[key].max
						}
					]);
				}
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
				
				let html = `<div class="bar" style="display:flex;flex-direction:column-reverse;border:1px solid #a4a4a4;padding:0px 5px 0px 5px;background-color:rgba(113, 130, 190, 0.35);border-radius:2px">`;
				
				for (let i = 1; i <= this.actor.system[bartype].max; i++) {
					html = html + `<div style="background-color:${i<=this.actor.system[bartype].value ? fillcolor : "#000000"};width:${1.6 * size}px;height:${size}px;margin-top:1.75px;margin-right:1px;margin-bottom:1.75px;margin-left:1px;border-radius:2px"></div>`;
				}
				
				html = html + `</div>`;
					
				bars[side].push(html);
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
						label: game.i18n.localize(attributes[attribute].label),
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
						
						return new ARGON.DRAWER.DrawerButton([
							{
								label: game.i18n.localize("CORIOLIS.SKILL_" + skill.key),
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
								label: game.i18n.localize("CORIOLIS.ATTRIBUTES"),
							},
							{
								label: "", //looks nicer
							},
							{
								label: game.i18n.localize("ROLL.ROLL"),
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
								label: game.i18n.localize("CORIOLIS.ATTRIBUTES"),
							},
							{
								label: game.i18n.localize("CORIOLIS.ROLL"),
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
								label: game.i18n.localize("CORIOLIS.SKILLS"),
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
			return `${game.i18n.localize("CORIOLIS.ATTRIBUTES")} & ${game.i18n.localize("CORIOLIS.SKILLS")}`;
		}
	}
  
    class CORIOLISActionActionPanel extends ARGON.MAIN.ActionPanel {
		constructor(...args) {
			super(...args);
		}

		get label() {
			return ModuleName+".Titles.ActionAction";
		}
		
		get maxActions() {
            return 1;
        }
		
		get currentActions() {
			return this.isActionUsed ? 0 : 1;
		}
		
		_onNewRound(combat) {
			this.isActionUsed = false;
			this.updateActionUse();
		}
		
		async _getButtons() {
			const specialActions = Object.values(CORIOLISECHActionItems);

			let buttons = [];
			
			buttons.push(new CORIOLISItemButton({ item: null, isWeaponSet: true, isPrimary: true }));
			buttons.push(new ARGON.MAIN.BUTTONS.SplitButton(new CORIOLISSpecialActionButton(specialActions[0]), new CORIOLISSpecialActionButton(specialActions[1])));
			buttons.push(new CORIOLISButtonPanelButton({type: "ability", color: 0}));
			
			return buttons.filter(button => button.items == undefined || button.items.length);
		}
    }
	
    class CORIOLISManeuverActionPanel extends ARGON.MAIN.ActionPanel {
		constructor(...args) {
			super(...args);
		}

		get label() {
			return ModuleName+".Titles.ManeuverAction";
		}
		
		get maxActions() {
            return 1;
        }
		
		get currentActions() {
			return this.isActionUsed ? 0 : 1;
		}
		
		_onNewRound(combat) {
			this.isActionUsed = false;
			this.updateActionUse();
		}
		
		async _getButtons() {
			const specialActions = Object.values(CORIOLISECHManeuverItems);

			const buttons = [
				new ARGON.MAIN.BUTTONS.SplitButton(new CORIOLISSpecialActionButton(specialActions[0]), new CORIOLISSpecialActionButton(specialActions[1])),
				new CORIOLISButtonPanelButton({type: "gear", color: 1})
			];
			if (game.settings.get(ModuleName, "ShowTalents")) {
				buttons.push(new CORIOLISButtonPanelButton({type: "talent", color: 1}));
			}
			buttons.push(new ARGON.MAIN.BUTTONS.SplitButton(new CORIOLISSpecialActionButton(specialActions[2]), new CORIOLISSpecialActionButton(specialActions[3])));
			
			return buttons.filter(button => button.items == undefined || button.items.length);
		}
    }
	
    class CORIOLISReactionActionPanel extends ARGON.MAIN.ActionPanel {
		constructor(...args) {
			super(...args);
		}

		get label() {
			return ModuleName+".Titles.ReAction";
		}
		
		async _getButtons() {
			const specialActions = Object.values(CORIOLISECHReactionItems);

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

		get quantity() {
			if (game.settings.get(ModuleName, "ConsumeBullets")) {
				if (this.item?.type == "weapon") {
					if (this.item.system.category == "ranged") {
						return this.actor.system.resources.bullets.value;
					}
				}
			}
			
			return null;
		}
		
		async _onLeftClick(event) {
			var used = false;
			
			if (this.item.type == "weapon") {
				if (game.settings.get(ModuleName, "ConsumeBullets") && this.quantity) {
					const newvalue = this.actor.system.resources.bullets.value - 1;
					
					if (newvalue >= 0) {
						this.actor.update({system : {resources : {bullets : {value : newvalue}}}});
						
						used = true;
					}
				}
				else {
					used = true;
				}
				
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
		constructor({type, subtype, color}) {
			super();
			this.type = type;
			this.color = color;
			
			Hooks.on("updateActor", (actor, changes, infos, sender) => {
				if (this.quantity != null) {
					if (this.actor == actor) {
						this.render();
					}
				}
			});
		}

		get colorScheme() {
			return this.color;
		}
	
		get quantity() {
			if (this.type == "ability") {
				//return this.actor.system.resource_points.value;
			}
			
			return null;
		}

		get label() {
			if (this.type == "ability") {
				return "CORIOLIS.ABILITY";
			}
			
			return "TYPES.Item." + this.type;
		}

		get icon() {
			switch (this.type) {
				case "gear": return "modules/enhancedcombathud/icons/svg/backpack.svg";
				case "magic": return "modules/enhancedcombathud/icons/svg/spell-book.svg";
				case "talent": return "icons/svg/book.svg";
				case "ability":
					switch(this.actor.system.creatureType) {
						case "human": return "modules/enhancedcombathud-mutant-year-zero/icons/talk.svg";
						case "mutant": return "modules/enhancedcombathud-mutant-year-zero/icons/dna1.svg";
						case "animal": return "modules/enhancedcombathud-mutant-year-zero/icons/paw.svg";
						case "robot": return "modules/enhancedcombathud-mutant-year-zero/icons/microchip.svg";
					}
			}
		}
		
		async getData() {
			const prevData = super.getData();
			
			const quantity = this.quantity;
			return {
				...prevData,
				quantity: quantity,
				hasQuantity: Number.isNumeric(quantity)
			}
		}
		
		async _getPanel() {
			return new ARGON.MAIN.BUTTON_PANELS.ButtonPanel({buttons: this.actor.items.filter(item => item.type == this.type).map(item => new CORIOLISItemButton({item}))});
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
			switch (this.item?.flags[ModuleName]?.actiontype) {
				case "action":
					return 0;
					break;
				case "maneuver":
					return 1;
					break;
				case "react":
					return 3;
					break;
			}
			return 0;
		}

		async getTooltipData() {
			const tooltipData = await getTooltipDetails(this.item, this.actor.system.creatureType);
			return tooltipData;
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
			consumeAction(item.flags[ModuleName].actiontype);
		}
    }
	
	class CORIOLISMovementHud extends ARGON.MovementHud {

		constructor (...args) {
			super(...args);
		}

		get movementMax() {
			return this.actor.system.movementRate / canvas.scene.dimensions.distance;
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
				if(item?.type !== "weapon") return;
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
		CORIOLISManeuverActionPanel,
		CORIOLISReactionActionPanel,
		ARGON.PREFAB.PassTurnPanel
    ]);  
	CoreHUD.defineMovementHud(null);
	CoreHUD.defineMovementHud(CORIOLISMovementHud);
    CoreHUD.defineWeaponSets(CORIOLISWeaponSets);
	CoreHUD.defineSupportedActorTypes(["character", "npc", "ship"]);
});
