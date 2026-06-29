// =====================================================
// TOWN MODULE
// Handles coordinated town runs.
//
// Job:
// - Decide when this character needs town.
// - Tell party members to go to town too.
// - Sell loot.
// - Buy potions.
// - Run item progression.
// - Return to farming.
// =====================================================


// =====================================================
// TOWN STATE
// Prevents overlapping async town runs.
// =====================================================

var TOWN_STATE = {
    busy: false,
    requested: false,
    request_sent: false,
    last_request: 0,
    last_run: 0,
    reason: ""
};


// =====================================================
// PUBLIC UPDATE
// Called by PartyRunner every loop.
// Returns true when town behavior is active.
// =====================================================

function town_update() {
    if (CONFIG.town_enabled !== true) {
        return false;
    }

    if (CONFIG.merchant_support_enabled === true && CONFIG.role !== "merchant") {
        return false;
    }

    if (TOWN_STATE.busy) {
        return true;
    }

    if (town_recently_finished()) {
        return false;
    }

    if (TOWN_STATE.requested) {
        town_start_run("party request");
        return true;
    }

    var reason = town_get_needed_reason();

    if (reason) {
        town_broadcast_request(reason);
        town_start_run(reason);
        return true;
    }

    return false;
}

// =====================================================
// TOWN NEED DETECTION
// Figures out why we need to go to town.
// =====================================================

function town_get_needed_reason() {
    if (inventory_free_slots() <= (CONFIG.free_slots_before_town || 5)) {
        return "inventory full";
    }

    if (town_needs_potions()) {
        return "low potions";
    }

    if (town_needs_item_progression()) {
        return "item progression";
    }

    return "";
}


function town_needs_potions() {
    if (CONFIG.hp_potion && CONFIG.minimum_hp_potions) {
        if (inventory_item_quantity(CONFIG.hp_potion) < CONFIG.minimum_hp_potions) {
            return true;
        }
    }

    if (CONFIG.mp_potion && CONFIG.minimum_mp_potions) {
        if (inventory_item_quantity(CONFIG.mp_potion) < CONFIG.minimum_mp_potions) {
            return true;
        }
    }

    return false;
}


function town_needs_item_progression() {
    if (typeof item_progression_has_work !== "function") {
        return false;
    }

    if (CONFIG.auto_compound !== true) {
        return false;
    }

    if (character.gold < (CONFIG.compound_gold_floor || 0)) {
        return false;
    }

    return item_progression_has_work();
}

function town_recently_finished() {
    if (!TOWN_STATE.last_run) {
        return false;
    }

    var cooldown = PARTY.town_run_cooldown_ms || 15000;
    var now = Date.now();

    return now - TOWN_STATE.last_run < cooldown;
}

// =====================================================
// PARTY-WIDE TOWN REQUEST
// If one party member needs town, everyone should go.
// =====================================================

function town_broadcast_request(reason) {
    var now = Date.now();
    var cooldown = PARTY.town_request_cooldown_ms || 10000;

    if (TOWN_STATE.request_sent && now - TOWN_STATE.last_request < cooldown) {
        return;
    }

    TOWN_STATE.request_sent = true;
    TOWN_STATE.last_request = now;
    TOWN_STATE.requested = true;
    TOWN_STATE.reason = reason;

    if (typeof send_cm !== "function") {
        return;
    }

    for (var i = 0; i < PARTY.members.length; i++) {
        var member_name = PARTY.members[i];

        if (member_name === character.name) {
            continue;
        }

        send_cm(member_name, {
            type: "town_request",
            from: character.name,
            reason: reason
        });
    }

    game_log("Town requested: " + reason, "cyan");
}


// =====================================================
// CROSS-CHARACTER MESSAGES
// Adventure Land calls this when another character sends CM.
// =====================================================

function on_cm(name, data) {
    if (!party_is_member(name)) {
        return;
    }

    if (!data) {
        return;
    }

    if (typeof merchant_support_handle_cm === "function") {
        if (merchant_support_handle_cm(name, data)) {
            return;
        }
    }

    if (data.type === "town_request") {
        TOWN_STATE.requested = true;
        TOWN_STATE.reason = data.reason || "party request";

        game_log(
            "Town request from " + name + ": " + TOWN_STATE.reason,
            "cyan"
        );
    }
}

// =====================================================
// TOWN RUN
// The actual async town behavior.
// =====================================================

function town_start_run(reason) {
    if (TOWN_STATE.busy) {
        return;
    }

    TOWN_STATE.busy = true;
    TOWN_STATE.requested = true;
    TOWN_STATE.reason = reason || "town";

    town_run();
}


async function town_run() {
    try {
        set_message("Town: " + TOWN_STATE.reason);

        await town_smart_move("potions");

        set_message("Town wait");
        await town_delay(PARTY.town_wait_for_party_ms || 1500);

        await town_sell_loot();

        await town_buy_potions();

        if (
            CONFIG.run_item_progression_in_town === true &&
            typeof item_progression_run_once === "function"
        ) {
            await item_progression_run_once();
        }

        set_message("Return to " + CONFIG.monster);

        await town_smart_move(CONFIG.monster);
    } catch (error) {
        game_log("Town error: " + error, "red");
    }

    TOWN_STATE.busy = false;
    TOWN_STATE.requested = false;
    TOWN_STATE.request_sent = false;
    TOWN_STATE.reason = "";
    TOWN_STATE.last_run = Date.now();
}


// =====================================================
// SELLING
// Sells safe loot only.
// Runs multiple passes to avoid partial-selling weirdness.
// =====================================================

async function town_sell_loot() {
    for (var pass = 0; pass < 3; pass++) {
        var sold_something = false;

        for (var i = character.items.length - 1; i >= 0; i--) {
            var item = character.items[i];

            if (!item) {
                continue;
            }

            if (town_should_sell(item)) {
                set_message("Selling " + item.name);
                sell(i, item.q || 1);
                sold_something = true;
                await town_delay(500);
            }
        }

        if (!sold_something) {
            return;
        }

        await town_delay(500);
    }
}


function town_should_sell(item) {
    if (!item) {
        return false;
    }

    if (inventory_list_has(CONFIG.keep_items, item.name)) {
        return false;
    }

    if (inventory_list_has(CONFIG.compound_items, item.name)) {
        return false;
    }

    if (inventory_list_has(CONFIG.upgrade_items, item.name)) {
        return false;
    }

    if (inventory_list_has(CONFIG.sell_list, item.name)) {
        return true;
    }

    return CONFIG.sell_unknown_items === true;
}

// =====================================================
// POTION BUYING
// Restocks configured HP and MP potions.
// =====================================================

async function town_buy_potions() {
    if (CONFIG.hp_potion && CONFIG.desired_hp_potions) {
        await town_restock_potion(
            CONFIG.hp_potion,
            CONFIG.desired_hp_potions
        );
    }

    if (CONFIG.mp_potion && CONFIG.desired_mp_potions) {
        await town_restock_potion(
            CONFIG.mp_potion,
            CONFIG.desired_mp_potions
        );
    }
}


async function town_restock_potion(item_name, desired_amount) {
    var have = inventory_item_quantity(item_name);
    var need = desired_amount - have;

    if (need <= 0) {
        return;
    }

    set_message("Buying " + item_name);

    buy(item_name, need);

    await town_delay(700);
}

// =====================================================
// HELPERS
// =====================================================

async function town_smart_move(destination) {
    while (movement_is_smart_moving()) {
        await town_delay(250);
    }

    var result = smart_move(destination);

    if (result && result.catch) {
        result.catch(function (error) {
            game_log("Town smart_move failed: " + error, "orange");
        });
    }

    await result;
}


function town_delay(ms) {
    if (typeof core_delay === "function") {
        return core_delay(ms);
    }

    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}