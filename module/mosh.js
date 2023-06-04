// Import Modules
import { MothershipActor } from "./actor/actor.js";
import { MothershipActorSheet } from "./actor/actor-sheet.js";
import { MothershipCreatureSheet } from "./actor/creature-sheet.js";
import { MothershipShipSheet } from "./actor/ship-sheet.js";
import { MothershipItem } from "./item/item.js";
import { MothershipItemSheet } from "./item/item-sheet.js";
import {
  registerSettings
} from "./settings.js";

Hooks.once('init', async function () {

  game.mosh = {
    MothershipActor,
    MothershipItem,
    rollItemMacro,
    rollStatMacro
  };

  registerSettings();


  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d100",
    decimals: 2
  };

  // Define custom Entity classes
  CONFIG.Actor.documentClass  = MothershipActor;
  CONFIG.Item.documentClass  = MothershipItem;


  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);

  Actors.registerSheet("mosh", MothershipActorSheet, {
    types: ['character'],
    makeDefault: true
  });
  Actors.registerSheet("mosh", MothershipCreatureSheet, {
    types: ['creature'],
    makeDefault: false
  });
  Actors.registerSheet("mosh", MothershipShipSheet, {
    types: ['ship'],
    makeDefault: false
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("mosh", MothershipItemSheet, { makeDefault: true });

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function () {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });


  Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase();
  });
});

Hooks.once("ready", async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createMothershipMacro(data, slot));
});

//Hooks.on("preCreateActor", (createData) => {
/**
 * Set default values for new actors' tokens
 */
 Hooks.on("preCreateActor", (document, createData, options, userId) => {
  let disposition = CONST.TOKEN_DISPOSITIONS.NEUTRAL;

  if (createData.type == "creature") {
    disposition = CONST.TOKEN_DISPOSITIONS.HOSTILE
  }

  // Set wounds, advantage, and display name visibility
  mergeObject(createData,
    {
      "token.bar1": { "attribute": "health" },        // Default Bar 1 to Health 
      "token.bar2": { "attribute": "hits" },      // Default Bar 2 to Insanity
      "token.displayName": CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,     // Default display name to be on owner hover
      "token.displayBars": CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,     // Default display bars to be on owner hover
      "token.disposition": disposition,                               // Default disposition to neutral
      "token.name": createData.name                                   // Set token name to actor name
    })


  if (createData.type == "character") {
    createData.token.vision = true;
    createData.token.actorLink = true;
  }
})

Hooks.on('renderSidebarTab', async (app, html) => {
  if (app.options.id == "actors") {
    let button = $(`<button class="import-json"><i class="fas fa-file-import"></i> Import JSON</button>`);
    button.click(function() {
      d.render(true);
    });
    html.find(".directory-footer").append(button);
  }
});



/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createMothershipMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  console.log(data);

  // Create the macro command
  let command = `game.mosh.rollItemMacro("${item.name}");`;


  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: {
        "mosh.itemMacro": true
      }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}



/* -------------------------------------------- */
/*  Actor from JSON                             */
/* -------------------------------------------- */
let skillValues = {
  "archeology": {"value":10, "rank": "Trained"},
  "art": {"value":10, "rank": "Trained"},
  "athletics": {"value":10, "rank": "Trained"},
  "botany": {"value":10, "rank": "Trained"},
  "chemistry": {"value":10, "rank": "Trained"},
  "computers": {"value":10, "rank": "Trained"},
  "geology": {"value":10, "rank": "Trained"},
  "industrialequipment": {"value":10, "rank": "Trained"},
  "juryrigging": {"value":10, "rank": "Trained"},
  "linguistics": {"value":10, "rank": "Trained"},
  "mathematics": {"value":10, "rank": "Trained"},
  "militarytraining": {"value":10, "rank": "Trained"},
  "rimwise": {"value":10, "rank": "Trained"},
  "theology": {"value":10, "rank": "Trained"},
  "zerog": {"value":10, "rank": "Trained"},
  "zoology": {"value":10, "rank": "Trained"},
  "asteroidmining": {"value":15, "rank": "Expert"},
  "ecology": {"value":15, "rank": "Expert"},
  "explosives": {"value":15, "rank": "Expert"},
  "fieldmedicine": {"value":15, "rank": "Expert"},
  "firearms": {"value":15, "rank": "Expert"},
  "hacking": {"value":15, "rank": "Expert"},
  "handtohandcombat": {"value":15, "rank": "Expert"},
  "mechanicalrepair": {"value":15, "rank": "Expert"},
  "mysticism": {"value":15, "rank": "Expert"},
  "pathology": {"value":15, "rank": "Expert"},
  "pharmacology": {"value":15, "rank": "Expert"},
  "physics": {"value":15, "rank": "Expert"},
  "piloting": {"value":15, "rank": "Expert"},
  "psychology": {"value":15, "rank": "Expert"},
  "tactics": {"value":15, "rank": "Expert"},
  "wildernesssurvival": {"value":15, "rank": "Expert"},
  "artificialintenligence": {"value":20, "rank": "Master"},
  "command": {"value":20, "rank": "Master"},
  "cybernetics": {"value":20, "rank": "Master"},
  "engineering": {"value":20, "rank": "Master"},
  "exobiology": {"value":20, "rank": "Master"},
  "hyperspace": {"value":20, "rank": "Master"},
  "planetology": {"value":20, "rank": "Master"},
  "robotics": {"value":20, "rank": "Master"},
  "sophontology": {"value":20, "rank": "Master"},
  "surgery": {"value":20, "rank": "Master"},
  "xenoesoterism": {"value":20, "rank": "Master"},
}

let conditions = {
  "adrenalinerush": "[+] on all rolls for the next 2d10 minutes. Reduce your Stress by 1d5.",
  "anxious": "Gain 1 Stress.",
  "jumpy": "Gain 1 Stress. All Close crewmembers gain 2 Stress.",
  "overwhelmed": "All actions at [-] for 1d10 minutes. Permanently raise your Minimum Stress by 1.",
  "coward": "Gain a new Condition: You must make a Fear Save to engage in violence or flee.",
  "frightened": "Gain a new Condition: Phobia: When encountering your Phobia make a Fear Save [-] or gain 1d5 Stress.",
  "nightmares": "Gain a new Condition: Sleep is difficult, gain [-] on all Rest Saves.",
  "lossofconfidence": "Gain a new Condition: Choose one of your Skills and lose that Skill's bonus.",
  "deflated": "Gain a new Condition: Whenever a Close crewmember fails a Save, gain 1 Stress.",
  "doomed": "Gain a new Condition: You feel cursed and unlucky. All Critical Successes are instead Critical Failures.",
  "paranoid": "For the next week, whenever someone joins your group (even if they only left for a short period of time), make a Fear Save or gain 1 Stress.",
  "haunted": "Gain a new Condition: Something starts visiting you at night. In your dreams. Out of the corner of your eye. And soon it will start making demands.",
  "deathwish": "For the next 24 hours, whenever you encounter a stranger or known enemy, you must make a Sanity Save or immediately attack them.",
  "propheticvision": "You immediately experience an intense hallucination or vision of an impending terror or horrific event. Gain 1 Stress.",
  "catatonic": "Become unresponsive and unmoving for 2d10 minutes. Reduce Stress by 1d10.",
  "rage": "Immediately attack the closest crewmember until you inflict at least 2d10 DMG. If there is no crewmember Close, you attack your surrounding environment.",
  "spiraling": "Gain a new Condition: You make Panic Checks with Disadvantage.",
  "compoundingproblems": "Roll twice on this table. Permanently raise your Minimum Stress by 1.",
  "heartattack": "Permanently lose 1 Wound. Gain [-] on all rolls for 1d10 hours. Permanently raise your Minimum Stress by 1.",
  "collapse": "You no longer control this character. Hand your sheet to the Warden and roll up a new character to play."
}

async function createActorFromJson(jsonData) {
  let actorData;
  let newActor;
  // if (actorData.armor.length) {
  //   newActor.system.stats.armor = {
  //     "value": actorData.armor.armorPoints,
  //     "label": Armor
  //   }
  // }
  try {
    actorData = JSON.parse(jsonData);
    newActor = {
    "name": actorData.name,
    "type": "character",
    "img": "icons/svg/mystery-man.svg",
    "system": {
      "health": {
        "value": actorData.health,
        "max": actorData.maxHealth,
        "min": 0
      },
      "hits": {
        "value": actorData.wounds,
        "max": actorData.maxWounds
      },
      "biography": "",
      "notes": "",
      "weight": {"current": 0, "capacity": 0},
      "settings": {"useCalm": false},
      "class": {
        "value": actorData.characterClass.charAt(0).toUpperCase() + actorData.characterClass.slice(1)
      },
      "rank": {"value": ""},
      "pronouns": {"value": actorData.pronouns},
      "credits": {"value": actorData.credits},
      "stressdesc": {"value": actorData.traumaResponse},
      "xp": { "value": 0, "html": 0, "selectedSkill": ""},
      "stressdesc": {"value": actorData.traumaResponse},
      "attributes": {"level": { "value": actorData.highScore }},
      "stats": {
        "strength": {
          "value": actorData.strength,
          "label": "Strength",
          "mod": null
        },
        "speed": {
          "value": actorData.speed,
          "label": "Speed",
          "mod": null
        },
        "intellect": {
          "value": actorData.intellect,
          "label": "Intellect",
          "mod": null
        },
        "combat": {
          "value": actorData.combat,
          "label": "Combat",
          "mod": null
        },
        "sanity": {
          "value": actorData.sanity,
          "label": "Sanity"
        },
        "fear": {
          "value": actorData.fear,
          "label": "Fear"
        },
        "body": {
          "value": actorData.body,
          "label": "Body"
        }
      },
    "other": {
      "stress": {
      "value": actorData.stress,
      "min": actorData.minStress,
      "label": "Stress"
      },
      "resolve": 0
      }
    },
    "prototypeToken": {
      "name": actorData.name,
      "displayName": 0,
      "actorLink": false,
      "texture": {
        "src": "icons/svg/mystery-man.svg",
        "scaleX": 1,
        "scaleY": 1,
        "offsetX": 0,
        "offsetY": 0,
        "rotation": 0,
        "tint": null
      },
      "width": 1,
      "height": 1,
      "lockRotation": false,
      "rotation": 0,
      "alpha": 1,
      "disposition": -1,
      "displayBars": 0,
      "bar1": {
        "attribute": "health"
      },
      "bar2": {
        "attribute": "power"
      },
      "light": {
        "alpha": 0.5,
        "angle": 360,
        "bright": 0,
        "color": null,
        "coloration": 1,
        "dim": 0,
        "attenuation": 0.5,
        "luminosity": 0.5,
        "saturation": 0,
        "contrast": 0,
        "shadows": 0,
        "animation": {
          "type": null,
          "speed": 5,
          "intensity": 5,
          "reverse": false
        },
        "darkness": {
          "min": 0,
          "max": 1
        }
      },
      "sight": {
        "enabled": false,
        "range": null,
        "angle": 360,
        "visionMode": "basic",
        "color": null,
        "attenuation": 0.1,
        "brightness": 0,
        "saturation": 0,
        "contrast": 0
      },
      "detectionModes": [],
      "flags": {},
      "randomImg": false
    }
  };
  var items = [];
  if (actorData.trinket) {
    items.push({
      "name": "Trinket: " + actorData.trinket,
      "type": "item"
    })
  }
  if (actorData.patch) {
    items.push({
      "name": "Patch: " + actorData.patch,
      "type": "item"
    })
  }
  // Equipment
  for (let i = 0; i < actorData.equipment.length; i++) {
    items.push({
      "name": actorData.equipment[i].name,
      "type": "item",
      "system": {
        "description": actorData.equipment[i].description,
        "cost": actorData.equipment[i].cost,
        "quantity": actorData.equipment[i].quantity
      },
      "img": "icons/svg/item-bag.svg",
    })
  }
  // Items
  for (let i = 0; i < actorData.items.length; i++) {
    items.push({
      "name": actorData.items[i].title,
      "type": "item",
      "system": {
        "description": actorData.items[i].description,
        "cost": actorData.items[i].cost,
        "quantity": actorData.items[i].quantity
      },
      "img": "icons/svg/item-bag.svg",
    })
  }
  // Armor
  for (let i = 0; i < actorData.armor.length; i++) {
    items.push({
      "name": actorData.armor[i].name,
      "type": "armor",
      "system": {
        "description": actorData.armor[i].notes,
        "cost": actorData.armor[i].cost,
        "bonus": actorData.armor[i].armorPoints,
        "equipped": actorData.armor[i].equipped
      },
      "img": "icons/svg/item-bag.svg",
    })
  }
  // Weapons
  for (let i = 0; i < actorData.weapons.length; i++) {
    items.push({
      "name": actorData.weapons[i].weaponType,
      "type": "weapon",
      "system": {
        "description": actorData.weapons[i].special,
        "cost": actorData.weapons[i].cost,
        "ranges": {
          "short": 0,
          "medium": 0,
          "long": 0,
          "value": actorData.weapons[i].weaponRange
        },
        "equipped": actorData.weapons[i].equipped,
        "critEffect": actorData.weapons[i].critical,
        "shots": actorData.weapons[i].shots,
        "curShots": actorData.weapons[i].shots,
        "ammo": actorData.weapons[i].magazines,
        "shotsPerFire": "1",
        "useAmmo": false,
        "ammoType": "",
        "critDmg": actorData.weapons[i].critical,
        "critEffect": "",
        "damage": actorData.weapons[i].damageString
      },
      "img": "icons/svg/item-bag.svg",
    })
  }
  // Skills
  for (let i = 0; i < actorData.skills.length; i++) {
    let words = actorData.skills[i].split(/(?=[A-Z])/);
    let skillName = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    items.push({
      "name": skillName,
      "type": "skill",
      "system": {
        "description": "",
        "bonus": skillValues[actorData.skills[i].toLowerCase()].value,
        "rank": skillValues[actorData.skills[i].toLowerCase()].rank
      },
      "img": "icons/svg/item-bag.svg",
    })
  }
  // Conditions
  for (let i = 0; i < actorData.conditions.length; i++) {
    let conName = actorData.conditions[i].conditionType;
    let words = conName.split(/(?=[A-Z])/);
    let name = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    if (actorData.characterClass == "android" && conName.toLowerCase() == "heartattack") {
      name = "Short Circuit"
    }
    items.push({
      "name": name,
      "type": "condition",
      "system": {
        "description": conditions[conName.toLowerCase()],
        "treatment": {"value": 0, "html": ""}
      },
      "img": "icons/svg/item-bag.svg",
    })
  }
  newActor.items = items


  } catch(err) {
    console.error(err);
    ui.notifications.error("Invalid JSON data");
    return;
  }

  // Ensure the type of the actor (e.g., 'character') is correctly set according to your system
  newActor.type = 'character';
  // Here we assume the actorData structure is correctly formed according to your system needs

  // You might need additional checks/transformations depending on the JSON data structure

  try {
    await Actor.create(newActor);
    ui.notifications.info("Actor created successfully");
  } catch(err) {
    console.error(err);
    ui.notifications.error("Failed to create actor");
  }
}

let d = new Dialog({
  title: "Create Actor from JSON",
  content: `<p>Paste your JSON data below:</p><textarea id="json-data" rows="6" style="width:100%;"></textarea>`,
  buttons: {
    save: {
      icon: '<i class="fas fa-check"></i>',
      label: "Create",
      callback: (html) => {
        const jsonData = html.find('#json-data').val();
        createActorFromJson(jsonData);
      }
    },
    cancel: {
      icon: '<i class="fas fa-times"></i>',
      label: "Cancel"
    }
  },
  default: "save"
});
d.render(true);


/**
 * Roll Macro from a Weapon.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  console.log();

  if (item.type == "weapon") {
    return actor.rollWeapon(item.id);
  } else if (item.type == "item" || item.type == "armor" || item.type == "ability") {
    return actor.printDescription(item.id);
  } else if (item.type == "skill") {
    return actor.rollSkill(item.id);
  }

  console.error("No item type found: " + item);
}


/**
 * Roll Stat.
 * @param {string} statName
 * @return {Promise}
 */
function rollStatMacro() {
  var selected = canvas.tokens.controlled;
  const speaker = ChatMessage.getSpeaker();

  if (selected.length == 0) {
    selected = game.actors.tokens[speaker.token];
  }

  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const stat = actor ? Object.entries(actor.system.stats) : null;


  // if (stat == null) {
  //   ui.notifications.info("Stat not found on token");
  //   return;
  // }

  console.log(stat);

  return actor.rollStatSelect(stat);
}