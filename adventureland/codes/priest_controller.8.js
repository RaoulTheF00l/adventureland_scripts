// =====================================================
// PRIEST SUPPORT CONTROLLER
// Complements Mage Controller
//
// Mage / KrisAngel:
//   - Leader
//   - Chooses targets
//   - Hunts Goo
//
// Priest / PopeRaoul:
//   - Follows mage
//   - Heals party
//   - Uses MP potions ONLY
//   - Assists leader target
//   - Sells loot / buys MP pots / upgrades
// =====================================================


// =====================================================
// CONFIG
// =====================================================

var CONFIG = {
    monster: "bee",
    loop_ms: 100,

    // MP potion safety.
    // This priest does NOT use HP potions.
    use_mp_at: 0.40,

    // Healing behavior
    self_heal_at: 0.90,
    party_heal_at: 0.80,
    min_mp_to_heal: 80,

    // Movement behavior
    follow_distance: 100,
    heal_follow_distance: 80,

    // Town run settings
    free_slots_before_town: 6,

    // MP potions only
    mp_potion: "mpot0",
    desired_mp_potions: 150,

    // Selling behavior
    sell_list: [
        "slime"
    ],

    sell_unknown_items: false,

    // Items NEVER to sell.
    keep_items: [
        "hpot0", "hpot1",
        "mpot0", "mpot1",
        "scroll0", "scroll1", "scroll2",
        "cscroll0", "cscroll1", "cscroll2",
        "offering",
        "xpbooster", "luckbooster", "goldbooster",
        "computer", "stand0"
    ],

    // Auto-upgrade settings
    auto_upgrade: true,
    upgrade_scroll: "scroll0",
    upgrade_gold_floor: 20000,
    upgrade_max_level: 1,

    upgrade_items: [
        "staff",
        "wstaff",
        "coat",
        "pants",
        "shoes",
        "helmet",
        "gloves"
    ]
};


// =====================================================
// PARTY CONFIG
// =====================================================

// Mage is the leader.
var LEADER_NAME = "KrisAngel";

var PARTY = [
    "KrisAngel",
    "PopeRaoul",
    "KrisRanger"
];


// =====================================================
// STATE
// =====================================================

var doing_town_run = false;
var respawning = false;


// =====================================================
// LOAD MODULES
// =====================================================

load_code("auto_upgrade_module");

load_code("gold_meter");
load_code("party_module");
load_code("inventory_module")


// =====================================================
// MAIN LOOPS
// =====================================================

setInterval(main_loop, CONFIG.loop_ms);
setInterval(maintain_party, 10000);


// =====================================================
// MAIN LOOP
// =====================================================

function main_loop() {
    if (character.rip) {
        handle_death();
        return;
    }

    loot();

    // MP only. No HP potion usage anywhere.
    use_mp_potions_only();

    // Healing comes before town runs and attacking.
    // Priest's job is keeping the party alive.
    if (priest_heal_logic()) {
        return;
    }

    if (doing_town_run) {
        return;
    }

    if (needs_town_run()) {
        town_run();
        return;
    }

    // If nobody needs healing, help the mage kill its target.
    assist_leader();
}


// =====================================================
// MP POTIONS ONLY
// =====================================================

function use_mp_potions_only() {
    var mp_ratio = character.mp / character.max_mp;

    if (mp_ratio >= CONFIG.use_mp_at) {
        return;
    }

    if (typeof is_on_cooldown === "function" && is_on_cooldown("use_mp")) {
        return;
    }

    set_message("MP Potion");

    // Important:
    // This uses MP only.
    // Do NOT use use_hp_or_mp() in this priest script.
    use_skill("use_mp");
}



// =====================================================
// PRIEST HEALING LOGIC
// =====================================================

function priest_heal_logic() {
    var target = get_lowest_heal_target();

    if (!target) {
        move_near_leader();
        return false;
    }

    if (character.mp < CONFIG.min_mp_to_heal) {
        set_message("Need MP");
        move_near_leader();
        return true;
    }

    if (!is_in_range(target)) {
        set_message("Moving to heal " + target.name);
        move_near_entity(target, CONFIG.heal_follow_distance);
        return true;
    }

    if (can_heal(target)) {
        set_message("Healing " + target.name);
        heal(target);
        return true;
    }

    set_message("Heal cooldown");
    return true;
}

function get_lowest_heal_target() {
    var lowest = null;
    var lowest_ratio = 1;

    for (var i = 0; i < PARTY.length; i++) {
        var name = PARTY[i];
        var member = null;

        if (name === character.name) {
            member = character;
        } else {
            member = get_player(name);
        }

        if (!member) {
            continue;
        }

        if (member.rip) {
            continue;
        }

        var hp_ratio = member.hp / member.max_hp;

        var heal_threshold = CONFIG.party_heal_at;

        if (member.name === character.name) {
            heal_threshold = CONFIG.self_heal_at;
        }

        if (hp_ratio < heal_threshold && hp_ratio < lowest_ratio) {
            lowest = member;
            lowest_ratio = hp_ratio;
        }
    }

    return lowest;
}


// =====================================================
// TOWN RUN / SELLING / MP RESTOCK ONLY
// =====================================================

async function town_run() {
    doing_town_run = true;

    try {
        set_message("Town Run");

        await smart_move("potions");

        await sell_loot();
        await buy_mp_potions();

        if (CONFIG.auto_upgrade && typeof upgrade_one_item === "function") {
            await upgrade_one_item();
        }

        set_message("Back to Goo");
        await smart_move(CONFIG.monster);

    } catch (error) {
        game_log("Town run error: " + error, "red");
    }

    doing_town_run = false;
}

function needs_town_run() {
    if (free_slots() <= CONFIG.free_slots_before_town) {
        return true;
    }

    if (item_quantity(CONFIG.mp_potion) < 10) {
        return true;
    }

    if (
        CONFIG.auto_upgrade &&
        typeof find_upgrade_item_slot === "function" &&
        find_upgrade_item_slot() !== -1
    ) {
        return true;
    }

    return false;
}

async function sell_loot() {
    for (var i = 0; i < character.items.length; i++) {
        var item = character.items[i];

        if (!item) {
            continue;
        }

        if (should_sell(item)) {
            set_message("Selling " + item.name);
            sell(i, item.q || 1);
            await delay(250);
        }
    }
}

function should_sell(item) {
    if (CONFIG.keep_items.indexOf(item.name) !== -1) {
        return false;
    }

    if (CONFIG.upgrade_items.indexOf(item.name) !== -1) {
        return false;
    }

    if (CONFIG.sell_list.indexOf(item.name) !== -1) {
        return true;
    }

    return CONFIG.sell_unknown_items;
}

async function buy_mp_potions() {
    var have = item_quantity(CONFIG.mp_potion);
    var need = CONFIG.desired_mp_potions - have;

    if (need <= 0) {
        return;
    }

    set_message("Buying MP Pots");
    buy(CONFIG.mp_potion, need);

    await delay(500);
}


// =====================================================
// MOVEMENT HELPERS PRIEST
// =====================================================

function move_near_entity(entity, desired_distance) {
    if (!entity) {
        return;
    }

    if (distance(character, entity) <= desired_distance) {
        return;
    }

    move(
        character.x + (entity.x - character.x) / 2,
        character.y + (entity.y - character.y) / 2
    );
}



// =====================================================
// GENERAL HELPER
// =====================================================

function delay(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}