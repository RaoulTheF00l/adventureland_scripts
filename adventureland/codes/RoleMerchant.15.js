// =====================================================
// ROLE MERCHANT MODULE
//
// Job:
// - Let combat characters request merchant help.
// - Let combat characters send safe loot to the merchant.
// - Let the merchant send potions back.
// - Let the merchant sell/restock alone.
// - Let the merchant return to the farm.
// =====================================================


// =====================================================
// STATE
// =====================================================

var MERCHANT_STATE = {
    busy: false,

    requests: {},

    last_request_sent: 0,
    last_supply_sent: {},
    last_loot_send: 0
};


// =====================================================
// PUBLIC SUPPORT UPDATE
// Called by PartyRunner on every character.
// Non-merchants use this to ask the merchant for help.
// =====================================================

function merchant_support_update() {
    if (CONFIG.merchant_support_enabled !== true) {
        return false;
    }

    if (CONFIG.role === "merchant") {
        return false;
    }

    merchant_support_try_send_loot_to_merchant();

    var reason = merchant_support_get_need_reason();

    if (!reason) {
        return false;
    }

    merchant_support_request_merchant(reason);
    return true;
}


// =====================================================
// PUBLIC MERCHANT ROLE LOOP
// Called by PartyRunner when CONFIG.role === "merchant".
// =====================================================

function role_merchant_loop() {
    if (MERCHANT_STATE.busy) {
        return true;
    }

    merchant_try_mluck();

    if (merchant_needs_town()) {
        merchant_start_town_run("merchant restock");
        return true;
    }

    var request = merchant_get_active_request();

    if (request) {
        return merchant_handle_request(request);
    }

    return merchant_idle_near_party();
}


// =====================================================
// CROSS-CHARACTER MESSAGE HANDLER
// Called from Town.on_cm.
// Returns true if this module handled the message.
// =====================================================

function merchant_support_handle_cm(name, data) {
    if (!data) {
        return false;
    }

    if (data.type !== "merchant_help_request") {
        return false;
    }

    if (CONFIG.role !== "merchant") {
        return true;
    }

    if (!party_is_member(name)) {
        return true;
    }

    MERCHANT_STATE.requests[name] = {
        from: name,
        reason: data.reason || "help",
        map: data.map || character.map,
        x: data.x,
        y: data.y,
        hp_potion: data.hp_potion || "hpot0",
        mp_potion: data.mp_potion || "mpot0",
        have_hp: data.have_hp || 0,
        have_mp: data.have_mp || 0,
        created_at: Date.now()
    };

    game_log("Merchant request from " + name + ": " + MERCHANT_STATE.requests[name].reason, "cyan");

    return true;
}


// =====================================================
// NON-MERCHANT NEED DETECTION
// =====================================================

function merchant_support_get_need_reason() {
    if (inventory_free_slots() <= (CONFIG.free_slots_before_town || 5)) {
        return "inventory full";
    }

    if (CONFIG.hp_potion && CONFIG.minimum_hp_potions) {
        if (inventory_item_quantity(CONFIG.hp_potion) < CONFIG.minimum_hp_potions) {
            return "low HP potions";
        }
    }

    if (CONFIG.mp_potion && CONFIG.minimum_mp_potions) {
        if (inventory_item_quantity(CONFIG.mp_potion) < CONFIG.minimum_mp_potions) {
            return "low MP potions";
        }
    }

    return "";
}

function merchant_support_request_merchant(reason) {
    var merchant_name = CONFIG.merchant_name || PARTY.merchant;

    if (!merchant_name) {
        return false;
    }

    var now = Date.now();
    var cooldown = CONFIG.merchant_request_cooldown_ms || 5000;

    if (now - MERCHANT_STATE.last_request_sent < cooldown) {
        return false;
    }

    MERCHANT_STATE.last_request_sent = now;

    if (typeof send_cm !== "function") {
        return false;
    }

    send_cm(merchant_name, {
        type: "merchant_help_request",
        from: character.name,
        reason: reason,

        map: character.map,
        x: character.x,
        y: character.y,

        hp_potion: CONFIG.hp_potion || "hpot0",
        mp_potion: CONFIG.mp_potion || "mpot0",

        have_hp: inventory_item_quantity(CONFIG.hp_potion || "hpot0"),
        have_mp: inventory_item_quantity(CONFIG.mp_potion || "mpot0")
    });

    set_message("Merchant: " + reason);
    return true;
}


// =====================================================
// NON-MERCHANT LOOT TRANSFER
// Sends only configured sell-list loot to merchant.
// This avoids accidentally sending gear, scrolls, boosters, etc.
// =====================================================

function merchant_support_try_send_loot_to_merchant() {
    var merchant_name = CONFIG.merchant_name || PARTY.merchant;

    if (!merchant_name) {
        return false;
    }

    var merchant = get_player(merchant_name);

    if (!merchant) {
        return false;
    }

    var transfer_distance = CONFIG.merchant_transfer_distance || 250;

    if (distance(character, merchant) > transfer_distance) {
        return false;
    }

    var now = Date.now();

    if (now - MERCHANT_STATE.last_loot_send < 1000) {
        return false;
    }

    MERCHANT_STATE.last_loot_send = now;

    var sent_something = false;

    for (var i = character.items.length - 1; i >= 0; i--) {
        var item = character.items[i];

        if (!item) {
            continue;
        }

        if (!merchant_support_should_send_item(item)) {
            continue;
        }

        send_item(merchant_name, i, item.q || 1);
        sent_something = true;
    }

    if (sent_something) {
        set_message("Sent loot");
    }

    return sent_something;
}

function merchant_support_should_send_item(item) {
    if (!item) {
        return false;
    }

    if (!inventory_list_has(CONFIG.sell_list, item.name)) {
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

    return true;
}


// =====================================================
// MERCHANT REQUEST HANDLING
// =====================================================

function merchant_get_active_request() {
    var now = Date.now();
    var oldest_name = "";
    var oldest_time = 0;

    for (var name in MERCHANT_STATE.requests) {
        var request = MERCHANT_STATE.requests[name];

        if (!request) {
            continue;
        }

        // Drop stale requests after 60 seconds.
        if (now - request.created_at > 60000) {
            delete MERCHANT_STATE.requests[name];
            continue;
        }

        if (!oldest_name || request.created_at < oldest_time) {
            oldest_name = name;
            oldest_time = request.created_at;
        }
    }

    if (!oldest_name) {
        return null;
    }

    return MERCHANT_STATE.requests[oldest_name];
}

function merchant_handle_request(request) {
    if (!request) {
        return false;
    }

    var requester = get_player(request.from);

    if (requester) {
        var transfer_distance = CONFIG.merchant_transfer_distance || 250;

        if (distance(character, requester) <= transfer_distance) {
            set_message("Supplying " + request.from);

            merchant_send_supplies(request.from, request);

            // Stay nearby briefly so the other character can send loot.
            if (Date.now() - request.created_at > 6000) {
                delete MERCHANT_STATE.requests[request.from];
            }

            return true;
        }

        set_message("To " + request.from);
        movement_move_near_entity(requester, 80);
        return true;
    }

    if (request.x !== undefined && request.y !== undefined) {
        set_message("To request");
        movement_smart_move({
            map: request.map || character.map,
            x: request.x,
            y: request.y
        });
        return true;
    }

    delete MERCHANT_STATE.requests[request.from];
    return false;
}

function merchant_send_supplies(member_name, request) {
    var now = Date.now();
    var cooldown = CONFIG.merchant_supply_cooldown_ms || 4000;

    if (MERCHANT_STATE.last_supply_sent[member_name]) {
        if (now - MERCHANT_STATE.last_supply_sent[member_name] < cooldown) {
            return false;
        }
    }

    MERCHANT_STATE.last_supply_sent[member_name] = now;

    var hp_potion = request.hp_potion || CONFIG.hp_potion || "hpot0";
    var mp_potion = request.mp_potion || CONFIG.mp_potion || "mpot0";

    merchant_send_item_quantity(
        member_name,
        hp_potion,
        CONFIG.merchant_send_hp_amount || 50
    );

    merchant_send_item_quantity(
        member_name,
        mp_potion,
        CONFIG.merchant_send_mp_amount || 75
    );

    return true;
}

function merchant_send_item_quantity(member_name, item_name, amount) {
    if (amount <= 0) {
        return false;
    }

    for (var i = 0; i < character.items.length; i++) {
        var item = character.items[i];

        if (!item) {
            continue;
        }

        if (item.name !== item_name) {
            continue;
        }

        var available = item.q || 1;
        var send_amount = Math.min(available, amount);

        if (send_amount <= 0) {
            return false;
        }

        send_item(member_name, i, send_amount);
        return true;
    }

    return false;
}


// =====================================================
// MERCHANT TOWN RUN
// =====================================================

function merchant_needs_town() {
    if (inventory_free_slots() <= (CONFIG.merchant_free_slots_before_town || 8)) {
        return true;
    }

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

function merchant_start_town_run(reason) {
    if (MERCHANT_STATE.busy) {
        return;
    }

    MERCHANT_STATE.busy = true;
    merchant_town_run(reason || "merchant town");
}

async function merchant_town_run(reason) {
    try {
        set_message(reason);

        await merchant_smart_move("potions");

        if (typeof town_sell_loot === "function") {
            await town_sell_loot();
        }

        if (typeof town_buy_potions === "function") {
            await town_buy_potions();
        }

        set_message("Return farm");
        await merchant_smart_move(CONFIG.monster || PARTY.default_monster);
    } catch (error) {
        game_log("Merchant town error: " + error, "red");
    }

    MERCHANT_STATE.busy = false;
}

async function merchant_smart_move(destination) {
    while (movement_is_smart_moving()) {
        await core_delay(250);
    }

    var result = smart_move(destination);

    if (result && result.catch) {
        result.catch(function (error) {
            game_log("Merchant smart_move failed: " + error, "orange");
        });
    }

    await result;
}


// =====================================================
// MERCHANT IDLE / SUPPORT SKILLS
// =====================================================

function merchant_idle_near_party() {
    var leader = get_player(PARTY.leader);

    if (leader) {
        set_message("Merchant follow");
        movement_move_near_entity(leader, CONFIG.follow_distance || 160);
        return true;
    }

    set_message("Merchant farm");
    movement_smart_move(CONFIG.monster || PARTY.default_monster);
    return true;
}

function merchant_try_mluck() {
    if (CONFIG.use_mluck !== true) {
        return false;
    }

    if (typeof use_skill !== "function") {
        return false;
    }

    if (!core_skill_ready("mluck")) {
        return false;
    }

    var target = merchant_get_mluck_target();

    if (!target) {
        return false;
    }

    if (!is_in_range(target)) {
        return false;
    }

    set_message("MLuck");
    use_skill("mluck", target);
    return true;
}

function merchant_get_mluck_target() {
    var leader = get_player(PARTY.leader);

    if (leader) {
        return leader;
    }

    for (var i = 0; i < PARTY.members.length; i++) {
        var member_name = PARTY.members[i];

        if (member_name === character.name) {
            continue;
        }

        var member = get_player(member_name);

        if (member) {
            return member;
        }
    }

    return null;
}