const ModuleName = "enhancedcombathud-yzecoriolis";
import { coriolisModifierDialog, coriolisRoll } from "/systems/yzecoriolis/module/coriolis-roll.js";

async function getTooltipDetails(item, actortype) {
	let title, description, itemType, creatureType, skillmodifiers, attributemodifiers, validskills, category, subtitle, range, damage, bonus, quantity, comment, requirement;
	let propertiesLabel = "MYZ.REQUIREMENT";
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
	damage = item.system?.damage;
	bonus = item.system?.bonus;
	quantity = item.system?.quantity;
	comment = item.system?.comment;
	requirement = item.system?.requirement;
	if (!requirement) {
		requirement = item.system?.dev_requirement;
		propertiesLabel = "MYZ.DEV_REQUIREMENT";
	}
	
	properties = [];

	subtitle = skillmodifiers.map(key => game.i18n.localize(`MYZ.SKILL_${key}`));
	subtitle = subtitle.concat(attributemodifiers.map(key => game.i18n.localize(`MYZ.ATTRIBUTE_${key.toUpperCase()}_${creatureType.toUpperCase()}`)));
	subtitle = subtitle.join("/");

	switch (itemType) {
		case "weapon":
			let skill;
			switch (category) {
				case "melee":
					switch(creatureType) {
						case "robot":
							skill = "ASSAULT";
							break;
						default:
							skill = "FIGHT";
							break;
					}
					break;
				case "ranged":
					skill = "SHOOT";
					break;
			}
			subtitle = game.i18n.localize(`MYZ.SKILL_${skill}`);
			
			details.push({
				label: "MYZ.DAMAGE",
				value: damage
			});
			details.push({
				label: "MYZ.RANGE",
				value: game.i18n.localize("MYZ." + range.toUpperCase())
			});
			break;
	}

	if (description) description = await TextEditor.enrichHTML(description);
	
	if (bonus) {
		details.push({
			label: "MYZ.BONUS",
			value: bonus.value
		});
	}
	
	if (quantity != undefined && details.length < 3) {
		details.push({
			label: "MYZ.QUANTITY",
			value: quantity
		});		
	}
	
	if (requirement) {
		properties.push({ label: requirement });
	}

	return { title, description, subtitle, details, properties , propertiesLabel, footerText: comment };
}

function openRollDialoge(rollType, rollID, rollActor, rollitem = undefined) {
	let attributeKey;
	let attribute;
	let skillKey;
	let skill;
	
	let item = null;
	
	let coriolisrollType = rollType;
	
	switch(rollType) {
		case "attribute":
			attributeKey = rollID;
			attribute = rollActor.system.attributes[attributeKey];
			break;
		case "skill":
			skillKey = rollID;
			skill = rollActor.system.skills[skillKey];
			attributeKey = skill.attribute;
			attribute = rollActor.system.attributes[attributeKey];
			
			coriolisrollType = skill.category;
			break;
		case "weapon":
		case "explosive":
			item = rollActor.items.get(rollID);
			break;
	}
	
    const rollData = {
      actorType: rollActor.type,
      rollType: coriolisrollType,
      attributeKey: attributeKey,
      attribute: attribute ? attribute.value : 0,
      skillKey: skillKey,
      skill: skill ? skill.value : 0,
      modifier: 0,
      bonus: 0,
      rollTitle: rollID,
      pushed: false,
      isAutomatic: item?.automatic,
      isExplosive: item?.explosive,
      blastPower: item?.blastPower,
      blastRadius: item?.blastRadius,
      damage: item?.damage,
      damageText: item?.damageText,
      range: item?.range,
      crit: item?.crit?.numericValue,
      critText: item?.crit?.customValue,
      features: item?.special ? Object.values(item.special).join(", ") : "",
    };
	
	console.log(rollData);
	
    const chatOptions = rollActor._prepareChatRollOptions(
      "systems/yzecoriolis/templates/sidebar/roll.html",
      rollType
    );
    coriolisModifierDialog((modifier, additionalData) => {
      rollData.modifier = modifier;
      rollData.additionalData = additionalData;
      coriolisRoll(chatOptions, rollData);
    }, false);
}

export { ModuleName, getTooltipDetails, openRollDialoge }