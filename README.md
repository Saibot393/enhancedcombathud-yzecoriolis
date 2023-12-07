# Argon-Coriolis
An implementation of the [Argon - Combat HUD](https://foundryvtt.com/packages/enhancedcombathud) (by [TheRipper93](https://theripper93.com/) and [Mouse0270](https://github.com/mouse0270)) for the [Coriolis]([https://foundryvtt.com/packages/mutant-year-zero](https://foundryvtt.com/packages/yzecoriolis)) system. The Argon Combat HUD (CORE) module is required for this module to work.

![image](https://github.com/Saibot393/enhancedcombathud-yzecoriolis/assets/137942782/ac620881-aee4-4ee4-8db6-bea9465cd68f)

<sup>All icon included in this project are from [Game-icons.net](game-icons.net), used under the [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) license</sup>

### The documentation for the core argon features can be found [here](https://api.theripper93.com/modulewiki/enhancedcombathud/free)

This module adjusts various Argon features for the Coriolis system:
- **Portrait**
    - Both HP and MP will be displayed as bars on the left side
    - Radiation will be displayed at the right side
- **Action tracking** the 3AP are tracked for various standard actions
- **Skills and Attributes** advanced skills are only shown if the character has atleast one point in them
- **Tooltips** will display tech tier, bonus, quantity, initiative, damage, crit, range, power, radius and automatic where applicable
- **Movement** will automatically consume AP

Due to licensing i am not able to include official text from the book for the description of the standard actions (help, move, take cover...). The default description of these actions therefore only points to page in the rule book which describes them. Should you wish to customize the description of these actions, you can crate an item (i recommend using a talent) with the name `_argonUI_#ActionID` where `#ActionID` is replaced by the actions id:
- "first aid" : `FirstAid`
- "tinkering" : `Tinkering`
- "reload" : `Reload`
- "take cover" : `TakeCover`
- "duck" : `Duck`
- "stand up" : `StandUp`
- "draw weapon" : `DrawWeapon`
- "parry" : `Parry`
- "opportunity attack" : `Opportunity`
- "go into overwatch" : `Overwatch`
- "defend" : `Defend`
  
**You need to reload the game to apply the changes to the descriptions!**

#### Languages:

The module contains an English and a German translation. If you want additional languages to be supported [let me know](https://github.com/Saibot393/enhancedcombathud-yzecoriolis/issues).

**If you have suggestions, questions, or requests for additional features please [let me know](https://github.com/Saibot393/enhancedcombathud-yzecoriolis/issues).**
