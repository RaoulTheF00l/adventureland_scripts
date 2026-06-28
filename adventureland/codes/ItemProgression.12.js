// =====================================================
// ITEM PROGRESSION MODULE
// Handles item improvement tasks.
//
// Current job:
// - Compound whitelisted accessories.
//
// Later job:
// - Upgrade weapons / armor.
// =====================================================


// =====================================================
// ITEM PROGRESSION STATE
// Prevents overlapping async actions.
// =====================================================

var ITEM_PROGRESSION_STATE = {
    busy: false,
    last_action: 0
};


// =====================================================
// PUBLIC CHECK
// Returns true if this character has item progression work.
// =====================================================

function item_progression_has_work() {
    if (CONFIG.auto_compound === true) {
        if (item_progression_find_compound_slots().length >= 3) {
            return true;
        }
    }

    if (CONFIG.auto_upgrade === true) {
        if (item_progression_find_upgrade_slot() !== -1) {
            return true;
        }
    }

    return false;
}


// =====================================================
// PUBLIC ACTION
// Runs one item progression action.
//
// For now:
// - Compound one matching accessory set.
// =====================================================

async function item_progression_run_once() {
    if (ITEM_PROGRESSION_STATE.busy) {
        return false;
    }

    ITEM_PROGRESSION_STATE.busy = true;

    try {
        // Compound first because accessories eat inventory space.
        if (CONFIG.auto_compound === true) {
            var did_compound = await item_progression_compound_one();

            if (did_compound) {
                ITEM_PROGRESSION_STATE.busy = false;
                return true;
            }
        }

        // Upgrade second.
        if (CONFIG.auto_upgrade === true) {
            var did_upgrade = await item_progression_upgrade_one();

            if (did_upgrade) {
                ITEM_PROGRESSION_STATE.busy = false;
                return true;
            }
        }
    } catch (error) {
        game_log("ItemProgression error: " + error, "red");
    }

    ITEM_PROGRESSION_STATE.busy = false;
    return false;
}

// =====================================================
// COMPOUND SLOT FINDING
// Finds 3 matching items with:
// - Same item name
// - Same item level
// - Item is whitelisted
// - Item level is below compound_max_level
// =====================================================

function item_progression_find_compound_slots() {
    if (!Array.isArray(CONFIG.compound_items)) {
        return [];
    }

    var buckets = {};

    for (var i = 0; i < character.items.length; i++) {
        var item = character.items[i];

        if (!item) {
            continue;
        }

        if (!item_progression_is_compound_allowed(item)) {
            continue;
        }

        var level = item.level || 0;
        var key = item.name + ":" + level;

        if (!buckets[key]) {
            buckets[key] = [];
        }

        buckets[key].push(i);

        if (buckets[key].length >= 3) {
            return buckets[key].slice(0, 3);
        }
    }

    return [];
}


function item_progression_is_compound_allowed(item) {
    if (!item) {
        return false;
    }

    if (!Array.isArray(CONFIG.compound_items)) {
        return false;
    }

    if (CONFIG.compound_items.indexOf(item.name) === -1) {
        return false;
    }

    var level = item.level || 0;

    if (level >= (CONFIG.compound_max_level || 1)) {
        return false;
    }

    return true;
}


// =====================================================
// COMPOUNDING
// Compounds one set of 3 matching whitelisted accessories.
// =====================================================

async function item_progression_compound_one() {
    if (CONFIG.auto_compound !== true) {
        return false;
    }

    if (character.gold < (CONFIG.compound_gold_floor || 0)) {
        set_message("Saving gold");
        return false;
    }

    var item_slots = item_progression_find_compound_slots();

    if (item_slots.length < 3) {
        return false;
    }

    var item = character.items[item_slots[0]];

    if (!item) {
        return false;
    }

    set_message("Need scroll");

    await smart_move("scrolls");

    var scroll_slot = locate_item(CONFIG.compound_scroll);

    if (scroll_slot === -1) {
        buy(CONFIG.compound_scroll, 1);
        await item_progression_delay(800);

        scroll_slot = locate_item(CONFIG.compound_scroll);
    }

    if (scroll_slot === -1) {
        game_log("Could not find compound scroll: " + CONFIG.compound_scroll, "orange");
        return false;
    }

    // Re-find item slots after buying/moving.
    // Inventory usually stays stable, but this makes the action safer.
    item_slots = item_progression_find_compound_slots();

    if (item_slots.length < 3) {
        return false;
    }

    item = character.items[item_slots[0]];

    if (!item) {
        return false;
    }

    set_message("Compounding");

    await smart_move("upgrade");

    game_log(
        "Compounding 3x " +
        item.name +
        " +" +
        (item.level || 0),
        "cyan"
    );

    compound(
        item_slots[0],
        item_slots[1],
        item_slots[2],
        scroll_slot
    );

    ITEM_PROGRESSION_STATE.last_action = Date.now();

    await item_progression_delay(1500);

    return true;
}

// =====================================================
// UPGRADING
// Upgrades one whitelisted item below upgrade_max_level.
// =====================================================

async function item_progression_upgrade_one() {
    if (CONFIG.auto_upgrade !== true) {
        return false;
    }

    if (character.gold < (CONFIG.upgrade_gold_floor || 0)) {
        set_message("Saving gold");
        return false;
    }

    var item_slot = item_progression_find_upgrade_slot();

    if (item_slot === -1) {
        return false;
    }

    var item = character.items[item_slot];

    if (!item) {
        return false;
    }

    set_message("Need scroll");

    await smart_move("scrolls");

    var scroll_slot = locate_item(CONFIG.upgrade_scroll);

    if (scroll_slot === -1) {
        buy(CONFIG.upgrade_scroll, 1);
        await item_progression_delay(800);

        scroll_slot = locate_item(CONFIG.upgrade_scroll);
    }

    if (scroll_slot === -1) {
        game_log("Could not find upgrade scroll: " + CONFIG.upgrade_scroll, "orange");
        return false;
    }

    // Re-find the item after buying/moving.
    item_slot = item_progression_find_upgrade_slot();

    if (item_slot === -1) {
        return false;
    }

    item = character.items[item_slot];

    if (!item) {
        return false;
    }

    set_message("Upgrading");

    await smart_move("upgrade");

    game_log(
        "Upgrading " +
        item.name +
        " +" +
        (item.level || 0),
        "cyan"
    );

    upgrade(item_slot, scroll_slot);

    ITEM_PROGRESSION_STATE.last_action = Date.now();

    await item_progression_delay(1500);

    return true;
}

// =====================================================
// UPGRADE SLOT FINDING
// Finds one whitelisted item below upgrade_max_level.
// Prefers the lowest-level valid item.
// =====================================================

function item_progression_find_upgrade_slot() {
    if (!Array.isArray(CONFIG.upgrade_items)) {
        return -1;
    }

    var best_slot = -1;
    var best_level = 999;

    for (var i = 0; i < character.items.length; i++) {
        var item = character.items[i];

        if (!item) {
            continue;
        }

        if (!item_progression_is_upgrade_allowed(item)) {
            continue;
        }

        var level = item.level || 0;

        if (level < best_level) {
            best_level = level;
            best_slot = i;
        }
    }

    return best_slot;
}


function item_progression_is_upgrade_allowed(item) {
    if (!item) {
        return false;
    }

    if (!Array.isArray(CONFIG.upgrade_items)) {
        return false;
    }

    if (CONFIG.upgrade_items.indexOf(item.name) === -1) {
        return false;
    }

    var level = item.level || 0;

    if (level >= (CONFIG.upgrade_max_level || 1)) {
        return false;
    }

    return true;
}

// =====================================================
// HELPERS
// =====================================================

function item_progression_delay(ms) {
    if (typeof core_delay === "function") {
        return core_delay(ms);
    }

    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}