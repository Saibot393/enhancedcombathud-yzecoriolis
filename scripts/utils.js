const ModuleName = "enhancedcombathud-yzecoriolis";
const SystemName = "YZECORIOLIS";
import { coriolisModifierDialog, coriolisRoll } from "/systems/yzecoriolis/module/coriolis-roll.js";

async function getTooltipDetails(item, actortype) {
	let title, description, itemType, creatureType, skillmodifiers, attributemodifiers, validskills, techTier, category, subtitle, subtitlecolor, range, automatic, power, radius, damage, bonus, quantity, initiative, crit, explosive, specials, hpbonus, mpbonus;
	let propertiesLabel = game.i18n.localize(SystemName + ".Special");
	let properties = [];
	let materialComponents = "";

	let details = [];
	
	if (!item || !item.system) return;

	title = item.name;
	description = item.system.description;
	itemType = item.type;
	creatureType = item.parent?.system.creatureType;
	skillmodifiers = [];
	attributemodifiers = [];
	validskills = item.system.skillKeysList;
	techTier = item.system.techTier;
	if (item.system.modifiers) {
		attributemodifiers = attributemodifiers.concat(Object.keys(item.system.modifiers).filter(key => item.system.modifiers[key] != 0 && !validskills.includes(key)));
		skillmodifiers = skillmodifiers.concat(Object.keys(item.system.modifiers).filter(key => item.system.modifiers[key] != 0 && validskills.includes(key)));
	}
	if (item.system.gearModifiers) {
		attributemodifiers = attributemodifiers.concat(Object.keys(item.system.gearModifiers).filter(key => item.system.gearModifiers[key] != 0 && !attributemodifiers.includes(key) && !validskills.includes(key)));
		skillmodifiers = skillmodifiers.concat(Object.keys(item.system.gearModifiers).filter(key => item.system.gearModifiers[key] != 0 && !skillmodifiers.includes(key) && validskills.includes(key)));
	}
	category = item.system.category;
	range = item.system?.range;
	automatic = item.system?.automatic;
	power = item.system?.blastPower;
	radius = item.system?.blastRadius;
	damage = item.system?.damage;
	bonus = item.system?.bonus;
	quantity = item.system?.quantity;
	initiative = item.system?.initiative;
	crit = item.system?.crit ? Object.values(item.system?.crit).filter(value => value).join("/") : "";
	explosive = item.system?.explosive;
	specials = item.system?.special;
	hpbonus = item.system?.hpBonus;
	mpbonus = item.system?.mpBonus;
	
	properties = [];

	switch (itemType) {
		case "weapon":
			switch (techTier) {
				default:
				case "P":
					subtitle = game.i18n.localize(`${SystemName}.TechTierPrimitive`);
					subtitlecolor = "#523d06";
					break;
				case "O":
					subtitle = game.i18n.localize(`${SystemName}.TechTierOrdinary`);
					break;
				case "A":
					subtitle = game.i18n.localize(`${SystemName}.TechTierAdvanced`);
					subtitlecolor = "#118209";
					break;
				case "F":
					subtitle = game.i18n.localize(`${SystemName}.TechTierFaction`);
					subtitlecolor = "#970ea1";
					break;
				case "R":
					subtitle = game.i18n.localize(`${SystemName}.TechTierPortalBuilderRelic`);
					subtitlecolor = "#ebb010"
					break;
			}
			if (specials) {
				properties.push(...(Object.values(specials).map(text => {return {label : text}})));
			}
			break;
		case "talent":
			let categoryName;
			switch (category) {
					case "group" :
						categoryName = "Group";
						break;
					case "icon" :
						categoryName = "Icon";
						break;
					case "general" :
						categoryName = "General";
						break;
					case "humanite" :
						categoryName = "Humanite";
						break;
					case "cybernetic" :
						categoryName = "Cybernetic";
						break;
					case "bionicsculpt" :
						categoryName = "BionicSculpt";
						break;
					case "mysticalpowers" :
						categoryName = "MysticalPowers";
						break;
			}
			subtitle = game.i18n.localize(`${SystemName}.TalentCat` + categoryName);
			break;
	}
	
	if (range) {
		range = firstUpperCase(range) + "Range";
	}
	
	if (radius) {
		radius = firstUpperCase(radius) + "Range";
	}

	switch (itemType) {
		case "weapon":
			details.push({
				label: SystemName + ".Bonus",
				value: bonus
			});
			details.push({
				label: SystemName + ".Initiative",
				value: initiative
			});
			details.push({
				label: SystemName + ".Damage",
				value: damage
			});
			details.push({
				label: SystemName + ".Crit",
				value: crit
			});
			
			if (explosive) {
				details.push({
					label: SystemName + ".BlastPower",
					value: power
				});
				details.push({
					label: SystemName + ".BlastRadius",
					value: game.i18n.localize(SystemName + "." + radius)
				});
			}
			else {
				details.push({
					label: SystemName + ".Range",
					value: game.i18n.localize(SystemName + "." + range)
				});
				details.push({
					label: SystemName + ".Automatic",
					value: automatic ? '<i class="fas fa-check"></i>' : 'test'
				});
			}
			break;
		case "gear":
			if (bonus) {
				details.push({
					label: SystemName + ".Bonus",
					value: bonus
				});
			}
			break;
		case "talent":
			if (hpbonus) {
				details.push({
					label: SystemName + ".HPBonus",
					value: hpbonus
				});
			}
			if (mpbonus) {
				details.push({
					label: SystemName + ".MPBonus",
					value: mpbonus
				});
			}
			break;
	}

	if (description) description = sanitize(description);
	
	if (quantity != undefined && details.length < 3) {
		details.push({
			label: SystemName + ".Quantity",
			value: quantity
		});		
	}

	return { title, description, subtitle, subtitlecolor, details, properties , propertiesLabel };
}

function openRollDialoge(rollType, rollID, rollActor, options = {modifier : 0}) {
	let attributeKey;
	let attribute;
	let skillKey;
	let skill;
	let bonus = 0;
	let rollnametype;
	let automaticWeapon = false;
	
	let item = null;
	
	let coriolisrollType = rollType;
	
	switch(rollType) {
		case "attribute":
			attributeKey = rollID;
			attribute = rollActor.system.attributes[attributeKey];
			rollnametype = "Attr";
			break;
		case "skill":
			skillKey = rollID;
			skill = rollActor.system.skills[skillKey];
			attributeKey = skill.attribute;
			attribute = rollActor.system.attributes[attributeKey];
			
			coriolisrollType = skill.category;
			rollnametype = "Skill";
			break;
		case "weapon":
			item = rollActor.items.get(rollID);
			
			automaticWeapon = item.system.automatic;
			
			if (item) {
				if (item.system.melee && !item?.explosive) {
					skillKey = "meleecombat";
					attributeKey = "strength";
				}
				else {
					skillKey = "rangedcombat";
					attributeKey = "agility";				
				}
				
				bonus = item.system.bonus;
				
				skill = rollActor.system.skills[skillKey];
				attribute = rollActor.system.attributes[attributeKey];
			}
			break;
		case "armor":
			item = rollActor.items.get(rollID);
			bonus = item.system.armorRating;
			break;
	}
	
	if (options.modifier) {
		bonus = bonus + options.modifier;
	}
	
    const rollData = {
      actorType: rollActor.type,
      rollType: coriolisrollType,
      attributeKey: attributeKey,
      attribute: attribute ? attribute.value : 0,
      skillKey: skillKey,
      skill: skill ? skill.value : 0,
      modifier: 0,
      bonus: bonus,
      rollTitle: item?.name? item.name : game.i18n.localize("YZECORIOLIS." + rollnametype + rollName(rollID) + "Roll"),
      pushed: false,
      isAutomatic: item?.system.automatic,
      isExplosive: item?.system.explosive,
      blastPower: item?.system.blastPower,
      blastRadius: item?.system.blastRadius,
      damage: item?.system.damage,
      damageText: item?.system.damageText,
      range: item?.system.range,
      crit: item?.system.crit?.numericValue,
      critText: item?.system.crit?.customValue,
      features: item?.system.special ? Object.values(item.system.special).join(", ") : "",
    };
	
    const chatOptions = rollActor._prepareChatRollOptions(
      "systems/yzecoriolis/templates/sidebar/roll.html",
      rollType
    );
    coriolisModifierDialog((modifier, additionalData) => {
      rollData.modifier = modifier;
      rollData.additionalData = additionalData;
      coriolisRoll(chatOptions, rollData);
    }, automaticWeapon);
}

function openItemRollDialoge(item, rollActor, options = {modifier : 0}) {
	if (rollActor.items.get(item.id)) {
		openRollDialoge(item.type, item.id, rollActor, options);
	}
}

function sanitize(string) {
	let parser = new DOMParser();
	
	let html = parser.parseFromString(string, 'text/html');
	
	return html.body.innerText;
}

function firstUpperCase(string) {
	return string[0].toUpperCase() + string.slice(1);
}

function rollName(rollname) {
	switch (rollname) {
		case "meleecombat": return "MeleeCombat";
		case "rangedcombat": return "RangedCombat";
		case "datadjinn": return "DataDjinn";
		case "mysticpowers": return "MysticPowers";
		default : return firstUpperCase(firstUpperCase(rollname));
	}
}

export { ModuleName, SystemName, getTooltipDetails, openRollDialoge, openItemRollDialoge, firstUpperCase }