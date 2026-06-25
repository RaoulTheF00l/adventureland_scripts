// =====================================================
// RANGER SUPPORT CONTROLLER
// KrisRanger: follows KrisAngel, assists target, loots,
// buys potions, sells slime, and upgrades starter gear.
// =====================================================


// =====================================================
// CONFIG
// =====================================================
var CONFIG = {
    monster: "bee",
    loop_ms: 100,

    // Potion safety
    use_hp_at: 0.50,
    use_mp_at: 0.35,

    // Positioning
    follow_distance: 120,
    attack_follow_distance: 90,
    kite_distance: 45,
    kite_step: 60,

    // Town run settings
    free_slots_before_town: 6,

    // Potions to keep stocked
    hp_potion: "hpot0",
    mp_potion: "mpot0",
    desired_hp_potions: 100,
    desired_mp_potions: 100,

    // Selling behavior
    sell_list: [
        "slime"
    ],

    sell_unknown_items: false,

    // Items NEVER to sell
    keep_items: [
        "hpot0", "mpot0",
        "hpot1", "mpot1",
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

    // Ranger-ish starter gear. Adjust item names after checking inventory.
    upgrade_items: [
        "bow", "wbow", "coat", "pants", "shoes", "helmet", "gloves"
    ],

    // Optional ranger skill. Keep false at first if you want the safest version.
    use_supershot: false,
    min_mp_for_supershot: 120
};


// =====================================================
// PARTY CONFIG
// =====================================================
var LEADER_NAME = "KrisAngel";
var PARTY = ["KrisAngel", "PopeRaoul", "KrisRanger"];


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
load_code("death_module");
load_code("inventory_module");

// Re-apply party values in case the current party_module still hardcodes them.
LEADER_NAME = "KrisAngel";
PARTY = ["KrisAngel", "PopeRaoul", "KrisRanger"];


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

    if (doing_town_run) {
        return;
    }

    if (needs_town_run()) {
        town_run();
        return;
    }

    ranger_combat();
}


// =====================================================
// COMBAT
// =====================================================
function ranger_combat() {
    if (is_smart_moving()) {
        return;
    }

    var target = get_leader_target();

    if (!is_valid_target(target)) {
        target = get_nearest_monster({ type: CONFIG.monster });

        if (target) {
            change_target(target);
        }
    }

    if (!target) {
        set_message("Following leader");
        move_near_leader();
        return;
    }

    change_target(target);

    if (kite_from_target(target)) {
        return;
    }

    if (!is_in_range(target)) {
        set_message("Ranger moving");
        move_near_entity(target, CONFIG.attack_follow_distance);
        return;
    }

    if (try_supershot(target)) {
        return;
    }

    if (can_attack(target)) {
        set_message("Ranger attacking");
        attack(target);
    }
}


function is_valid_target(target) {
    return target
        && !target.dead
        && target.type === "monster"
        && target.mtype === CONFIG.monster;
}


function try_supershot(target) {
    if (!CONFIG.use_supershot) {
        return false;
    }

    if (!target || character.mp < CONFIG.min_mp_for_supershot) {
        return false;
    }

    if (typeof is_on_cooldown === "function" && is_on_cooldown("supershot")) {
        return false;
    }

    if (typeof use_skill !== "function") {
        return false;
    }

    set_message("Super Shot");
    use_skill("supershot", target);
    return true;
}


// =====================================================
// POSITIONING
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


function kite_from_target(target) {
    if (!target || target.target !== character.name) {
        return false;
    }

    if (distance(character, target) > CONFIG.kite_distance) {
        return false;
    }

    var dx = character.x - target.x;
    var dy = character.y - target.y;
    var length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
        move_near_leader();
        return true;
    }

    var next_x = character.x + (dx / length) * CONFIG.kite_step;
    var next_y = character.y + (dy / length) * CONFIG.kite_step;

    set_message("Kiting");
    move(next_x, next_y);
    return true;
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
// MOVEMENT HELPERS
// =====================================================
function is_smart_moving() {
    return typeof smart !== "undefined" && smart.moving;
}


function start_smart_move(destination) {
    if (is_smart_moving()) {
        return;
    }

    var result = smart_move(destination);

    if (result && result.catch) {
        result.catch(function(error) {
            game_log("smart_move failed: " + error, "red");
        });
    }
}


// =====================================================
// GENERAL HELPER
// =====================================================
function delay(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}