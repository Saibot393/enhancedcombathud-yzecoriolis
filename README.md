# Argon-Mutant Year Zero
An implementation of the [Argon - Combat HUD](https://foundryvtt.com/packages/enhancedcombathud) (by [TheRipper93](https://theripper93.com/) and [Mouse0270](https://github.com/mouse0270)) for the [Mutant Year Zero](https://foundryvtt.com/packages/mutant-year-zero) system. The Argon Combat HUD (CORE) module is required for this module to work.

![image](https://github.com/Saibot393/enhancedcombathud-mutant-year-zero/assets/137942782/e8d067eb-6f91-49d8-ae3d-b23d8819ece6)

### The documentation for the core argon features can be found [here](https://api.theripper93.com/modulewiki/enhancedcombathud/free)

This module adjusts various Argon features for the Mutant Year Zero system:
- **Portrait**
    - While the current strength is alway displayed, the current values of the other three attributes is only displayed if they are below the maximum
    - The rot will be displayed on the profile (the permanent rot has a border)
- **Action tracking** takes the difference of actions and maneuvers into account and allows for the use of an available action for a maneuver
- **Skills and Attributes** adapt to the actor type
- **Weapon Sets** have a rudamental Drag&Drop system for weapons
- **Tooltips** will display used skills/attributes, descriptions, use cases, requirements, the bonus, the damage, and the range where applicable
- **Item Buttons** have an option to display resources (bullets or ability points) and consume these on use

Due to licensing i am not able to include official text from the book for the description of the standard actions (help, move, take cover...). The default description of these actions therefore only points to page in the rule book which describes them. Should you wish to customize the description of these actions, you can crate an item (i recommend using a talent) with the name `_argonUI_#ActionID` where `#ActionID` is replaced by the actions id:
- "help":`Help`,
- "hinder":`Hinder`
- "move":`Move`
- "take cover":`TakeCover`
- "draw weapon":`DrawWeapon`
- "reload":`Reload`
- "DEFEND":`Defend`
  
**You need to reload the game to apply the changes to the descriptions!**

Due to the way movement works in Mutant Year Zero the Movement Tracker is not (yet?) available to in this implementation.

#### Languages:

The module contains an English and a German translation. If you want additional languages to be supported [let me know](https://github.com/Saibot393/enhancedcombathud-mutant-year-zero/issues).

**If you have suggestions, questions, or requests for additional features please [let me know](https://github.com/Saibot393/enhancedcombathud-mutant-year-zero/issues).**
