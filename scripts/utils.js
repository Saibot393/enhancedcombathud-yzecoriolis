const ModuleName = "yzecoriolis";

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

function openRollDialoge(rollType, rollName, rollActor, rollitem = undefined) { //adapted from MYZ system code
	let rollData = {};
	
	let applyedModifiersInfo;
	
	switch (rollType) {
		case "skill":
			const skill = rollActor.items.find(item => item.type == rollType && item.system.skillKey == rollName);
			
			const diceTotals = rollActor.sheet._getRollModifiers(skill);
            diceTotals.gearDiceTotal = Math.max(0, diceTotals.gearDiceTotal);
			
			applyedModifiersInfo = rollActor.sheet._getModifiersInfo(diceTotals);
			
            let skillName = "";
            if (skill.system.skillKey == "") {
                skillName = skill.name;
            } else {
                skillName = game.i18n.localize(`MYZ.SKILL_${skill.system.skillKey}`);
            }
			
			rollData = {
				rollName : skillName,
			
				attributeName : skill.system.attribute,
			
				baseDefault: diceTotals.baseDiceTotal,
				skillDefault: diceTotals.skillDiceTotal,
				gearDefault: diceTotals.gearDiceTotal,
				
				applyedModifiers: applyedModifiersInfo,
				
				skillItem : skill
			}
			break;	
		case "attribute":
			const attributeValue = rollActor.system.attributes[rollName].value;
			
			const attributeName = `MYZ.ATTRIBUTE_${rollName.toUpperCase()}_${rollActor.system.creatureType.toUpperCase()}`;
			
			const items = rollActor.items.filter(item => item.system.modifiers != undefined);
			const modifierItems = items.filter(item => item.system.modifiers[rollName] != 0);
			let attributeModifiers = [];
			const baseDiceModifier = modifierItems.reduce(function (modifier, item) {
				attributeModifiers.push({ 'type': item.type, 'name': item.name, 'value': item.system.modifiers[rollName] })
				return modifier + item.system.modifiers[rollName];
			}, 0);
			
			let baseDiceTotal = parseInt(attributeValue) + parseInt(baseDiceModifier)
			if(baseDiceTotal<0) baseDiceTotal = 0;
			
			applyedModifiersInfo = rollActor.sheet._getModifiersInfo({
				skillDiceTotal: 0,
				baseDiceTotal: baseDiceTotal,
				gearDiceTotal: 0,
				modifiersToSkill: [],
				modifiersToAttributes: attributeModifiers,
				modifiersToGear: []
			});
			
			rollData = {
				rollName: attributeName, //this is confusing
				
				attributeName: rollName, //isn't it?
				
				baseDefault: baseDiceTotal,
				applyedModifiers: applyedModifiersInfo
			}
			break;
	}
	
	if (rollitem) {
		rollData.gearDefault = Math.max(parseInt(rollitem.system.bonus.value), 0),
		rollData.modifierDefault = rollitem.system.skillBonus,
		rollData.artifactDefault = rollitem.system.artifactBonus || 0,
		rollData.damage = rollitem.system.damage,
		rollData.rollName = rollitem.name;
	}
	
	game.myz.RollDialog.prepareRollDialog({...{
		rollName: "",
		attributeName : "",
		diceRoller: rollActor.sheet.diceRoller,
		baseDefault: 0,
		skillDefault: 0,
		gearDefault: 0,
		modifierDefault: 0,
		actor : rollActor,
		applyedModifiers: {}
	}, ...rollData});
}

function openItemRollDialoge(item, actor) {
	if (item && actor) {
		let skill;
		
		switch (item.system.category) {
			case "melee":
				switch(actor.system.creatureType) {
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
		
		openRollDialoge("skill", skill, actor, item);
	}
}


export { ModuleName, getTooltipDetails, openRollDialoge, openItemRollDialoge }

/*
    _onRollAttribute(event) {
        event.preventDefault();
        const attName = $(event.currentTarget).data("attribute");
        const attVal = this.actor.system.attributes[attName].value;
        let rollName = `MYZ.ATTRIBUTE_${attName.toUpperCase()}_${this.actor.system.creatureType.toUpperCase()}`;

        const itmMap = this.actor.items.filter(itm => itm.system.modifiers != undefined)
        const itemsThatModifyAttribute = itmMap.filter(i => i.system.modifiers[attName] != 0)
        let modifiersToAttributes = []
        const baseDiceModifier = itemsThatModifyAttribute.reduce(function (acc, obj) {
            modifiersToAttributes.push({ 'type': obj.type, 'name': obj.name, 'value': obj.system.modifiers[attName] })
            return acc + obj.system.modifiers[attName];
        }, 0);
        let baseDiceTotal = parseInt(attVal) + parseInt(baseDiceModifier)
        if(baseDiceTotal<0) baseDiceTotal = 0;

        const applyedModifiersInfo = this._getModifiersInfo({
            skillDiceTotal: 0,
            baseDiceTotal: baseDiceTotal,
            gearDiceTotal: 0,
            modifiersToSkill: [],
            modifiersToAttributes: modifiersToAttributes,
            modifiersToGear: []
        })

        RollDialog.prepareRollDialog({
            rollName: rollName,
            attributeName: attName,
            diceRoller: this.diceRoller,
            baseDefault: baseDiceTotal,
            skillDefault: 0,
            gearDefault: 0,
            modifierDefault: 0,
            applyedModifiers: applyedModifiersInfo
        });
    }
	
*/

/*
    _onRollSkill(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const itemId = $(element).data("item-id");
        if (itemId) {
            //FIND OWNED SKILL ITEM AND CREARE ROLL DIALOG
            const skill = this.actor.items.find((element) => element.id == itemId);
            const attName = skill.system.attribute;
            // Apply any modifiers from items or crits
            const diceTotals = this._getRollModifiers(skill);
            diceTotals.gearDiceTotal = Math.max(0, diceTotals.gearDiceTotal)

            // SEE IF WE CAN USE SKILL KEY TO TRANSLATE THE NAME
            let skillName = "";
            if (skill.system.skillKey == "") {
                skillName = skill.name;
            } else {
                skillName = game.i18n.localize(`MYZ.SKILL_${skill.system.skillKey}`);
            }

            const applyedModifiersInfo = this._getModifiersInfo(diceTotals);
            //console.warn(applyedModifiersInfo)

            RollDialog.prepareRollDialog({
                rollName: skillName,
                attributeName: attName,
                diceRoller: this.diceRoller,
                baseDefault: diceTotals.baseDiceTotal,
                skillDefault: diceTotals.skillDiceTotal,
                gearDefault: diceTotals.gearDiceTotal,
                modifierDefault: 0,
                applyedModifiers: applyedModifiersInfo,
                actor: this.actor,
                skillItem: skill
            });
        }
    }
	
	*/