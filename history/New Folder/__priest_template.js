// =====================================================
// PRIEST GOO FARMING
// Hunts Goo -> Loots -> Sells -> Buys Potions -> Upgrades
// =====================================================

const CONFIG = {
    monster: "goo",
    loop_ms: 250,

    // Potion safety
    use_hp_at: 0.50,
    use_mp_at: 0.35,

    // Priest healing
    self_heal_at: 0.75,
    min_mp_to_heal: 80,

    // Town run settings
    free_slots_before_town: 6,

    // Potions to keep stocked
    hp_potion: "hpot0",
    mp_potion: "mpot0",
    desired_hp_potions: 100,
    desired_mp_potions: 100,

    // Selling behavior
    // Start SAFE. Only sell items listed here.
    // Add more item names once you know you don't want them.
    sell_list: [
        "slime"
    ],

    // If true, sells everything not protected.
    // Leave this false until you're comfortable.
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

    // Basic upgrade scroll
    upgrade_scroll: "scroll0",

    // Keep some emergency gold
    upgrade_gold_floor: 20000,

    // Conservative starter cap.
    // Raise later when you understand upgrade risk.
    upgrade_max_level: 1,

    // Only upgrade these if they are sitting in your inventory.
    // Equipped gear is not touched.
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

let doing_town_run = false;

var PARTY = ["PopeRaoul" , "KrisAngel"];
var LEADER_NAME = "PopeRaoul";


// =====================================================
// MAIN LOOP
// =====================================================

setInterval(function () {
    if (character.rip) return;

    loot();
    use_potions();
    priest_self_heal();

    if (doing_town_run) return;

    if (needs_town_run()) {
        town_run();
        return;
    }

    hunt_goo();

}, CONFIG.loop_ms);


// =====================================================
// COMBAT
// =====================================================

function hunt_goo() {
    if (is_smart_moving()) return;

    let target = get_targeted_monster();

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
        move_halfway_to(target);
        return;
    }

    if (can_attack(target)) {
        set_message("Attacking Goo");
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
// PRIEST HEALING + POTIONS
// =====================================================

function priest_self_heal() {
    const hp_ratio = character.hp / character.max_hp;
    const is_priest = character.ctype === "priest" || character.type === "priest";

    if (!is_priest) return;
    if (hp_ratio > CONFIG.self_heal_at) return;
    if (character.mp < CONFIG.min_mp_to_heal) return;

    if (can_heal(character)) {
        set_message("Self Heal");
        heal(character);
    }
}

function use_potions() {
    const hp_ratio = character.hp / character.max_hp;
    const mp_ratio = character.mp / character.max_mp;

    if (mp_ratio < CONFIG.use_mp_at) {
        set_message("Potion");
        use_hp_or_mp();
    }
}


// =====================================================
// TOWN RUN / BUYING / SELLING
// =====================================================

load_code("town_run")

// =====================================================
// AUTO-UPGRADING
// =====================================================

load_code("auto_upgrading_module")

// =====================================================
// INVENTORY HELPERS
// =====================================================

function item_quantity(item_name) {
    let amount = 0;

    for (let i = 0; i < character.items.length; i++) {
        const item = character.items[i];

        if (item && item.name === item_name) {
            amount += item.q || 1;
        }
    }

    return amount;
}

function free_slots() {
    let count = 0;

    for (let i = 0; i < character.items.length; i++) {
        if (!character.items[i]) count++;
    }

    return count;
}


// =====================================================
// MOVEMENT HELPERS
// =====================================================

function is_smart_moving() {
    return typeof smart !== "undefined" && smart.moving;
}

function start_smart_move(destination) {
    if (is_smart_moving()) return;

    const result = smart_move(destination);

    if (result && result.catch) {
        result.catch(function (error) {
            game_log("smart_move failed: " + error, "red");
        });
    }
}


// =====================================================
// DEATH HANDLING
// =====================================================

function handle_death() {
    setTimeout(respawn, 15000);
    return true;
}


// =====================================================
// GENERAL HELPER
// =====================================================

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// =====================================================
// GOLD METER
// =====================================================

load_code("gold_meter")

// =====================================================
// PARTY LOGIC
// =====================================================


load_code("party_module")