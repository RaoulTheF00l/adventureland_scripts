// =====================================================
// MAGE GOO FARMING CONTROLLER
// Hunts Goo -> Loots -> Sells -> Buys Potions -> Upgrades
// =====================================================


// =====================================================
// CONFIG
// =====================================================

var CONFIG = {
    monster: "goo",
    loop_ms: 10,

    // Potion safety
    use_hp_at: 0.50,
    use_mp_at: 0.35,

    // Town run settings
    free_slots_before_town: 6,

    // Potions to keep stocked
    hp_potion: "hpot0",
    mp_potion: "mpot0",
    desired_hp_potions: 100,
    desired_mp_potions: 150,

    // Selling behavior
    sell_list: [
        "slime"
    ],

    sell_unknown_items: false,

    // Items NEVER to sell
    keep_items: [
        "hpot0", "mpot0", "hpot1", "mpot1",
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

    // Mage-ish starter gear.
    // Adjust this after checking your actual item names.
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

// Mage is the leader in this controller.
var LEADER_NAME = "KrisAngel";

var PARTY = [
    "KrisAngel",
    "PopeRaoul"
];


// =====================================================
// STATE
// =====================================================

var doing_town_run = false;
var respawning = false;


// =====================================================
// LOAD MODULES
// =====================================================

load_code("town_run");
load_code("auto_upgrade_module");
load_code("gold_meter");
load_code("party_module");
load_code("death_module")


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
    use_potions();

    if (doing_town_run) return;

    if (needs_town_run()) {
        town_run();
        return;
    }

    hunt_goo();
}


// =====================================================
// COMBAT
// =====================================================

function hunt_goo() {
    if (is_smart_moving()) return;

    var target = get_targeted_monster();

    if (!is_valid_target(target)) {
        target = get_nearest_monster({ type: CONFIG.monster });

        if (target) {
            change_target(target);
        }
    }

    if (!target) {
        set_message("Moving to Goo");
        start_smart_move(CONFIG.monster);
        return;
    }

    if (!is_in_range(target)) {
        set_message("Moving to Goo");
        move_halfway_to(target);
        return;
    }

    if (can_attack(target)) {
        set_message("Mage attacking");
        attack(target);
    }
}

function is_valid_target(target) {
    return target
        && !target.dead
        && target.type === "monster"
        && target.mtype === CONFIG.monster;
}

function move_halfway_to(target) {
    move(
        character.x + (target.x - character.x) / 2,
        character.y + (target.y - character.y) / 2
    );
}


// =====================================================
// POTIONS
// =====================================================

function use_potions() {
    var hp_ratio = character.hp / character.max_hp;
    var mp_ratio = character.mp / character.max_mp;

    if (hp_ratio < CONFIG.use_hp_at || mp_ratio < CONFIG.use_mp_at) {
        set_message("Potion");
        use_hp_or_mp();
    }
}


// =====================================================
// INVENTORY HELPERS
// =====================================================

function item_quantity(item_name) {
    var amount = 0;

    for (var i = 0; i < character.items.length; i++) {
        var item = character.items[i];

        if (item && item.name === item_name) {
            amount += item.q || 1;
        }
    }

    return amount;
}

function free_slots() {
    var count = 0;

    for (var i = 0; i < character.items.length; i++) {
        if (!character.items[i]) {
            count++;
        }
    }

    return count;
}


// =====================================================
// MOVEMENT HELPERS MAGE
// =====================================================

function is_smart_moving() {
    return typeof smart !== "undefined" && smart.moving;
}

function start_smart_move(destination) {
    if (is_smart_moving()) return;

    var result = smart_move(destination);

    if (result && result.catch) {
        result.catch(function (error) {
            game_log("smart_move failed: " + error, "red");
        });
    }
}



// =====================================================
// GENERAL HELPER
// =====================================================

function delay(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}