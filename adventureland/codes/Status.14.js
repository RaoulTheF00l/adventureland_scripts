// =====================================================
// STATUS MODULE
// Shows a small in-game HUD panel for each character.
//
// Displays:
// - Net gold/hr
// - XP/hr
// - Gold gained
// - XP gained
// - Runtime
// - HP / MP
// - Potion counts
// - Free inventory slots
// - Current state
// - Target
// - Town reason
// - Party count
// =====================================================


// =====================================================
// CLEAN RELOAD
// Remove this character's old status window if the module reloads.
// =====================================================

if (typeof STATUS_STATE !== "undefined" && STATUS_STATE.window_id) {
    status_remove_window(STATUS_STATE.window_id);
}


// =====================================================
// STATE
// =====================================================

var STATUS_STATE = {
    started_at: Date.now(),

    start_gold: character.gold || 0,
    start_xp: character.xp || 0,

    last_update: 0,
    update_ms: 1000,

    window_id: "status_window_" + character.name
};


// =====================================================
// STARTUP
// =====================================================

status_create_window();
status_update(true);


// =====================================================
// PUBLIC UPDATE
// Called by PartyRunner every loop.
// Internally throttled to once per second.
// =====================================================

function status_update(force) {
    var now = Date.now();

    if (force !== true && now - STATUS_STATE.last_update < STATUS_STATE.update_ms) {
        return;
    }

    STATUS_STATE.last_update = now;

    var elapsed_seconds = Math.max(1, (now - STATUS_STATE.started_at) / 1000);
    var elapsed_hours = elapsed_seconds / 3600;

    var gold_gained = character.gold - STATUS_STATE.start_gold;
    var xp_gained = character.xp - STATUS_STATE.start_xp;

    var gold_per_hour = gold_gained / elapsed_hours;
    var xp_per_hour = xp_gained / elapsed_hours;

    status_set("gold_hr", status_format_number(gold_per_hour));
    status_set("xp_hr", status_format_number(xp_per_hour));

    status_set("gold_gained", status_format_number(gold_gained));
    status_set("xp_gained", status_format_number(xp_gained));

    status_set("runtime", status_format_time(elapsed_seconds));

    status_set(
        "hp_mp",
        character.hp + "/" + character.max_hp +
        " | " +
        character.mp + "/" + character.max_mp
    );

    status_set("potions", status_get_potion_text());
    status_set("slots", status_get_free_slots_text());
    status_set("state", status_get_state_text());
    status_set("target", status_get_target_text());
    status_set("town", status_get_town_text());
    status_set("party", status_get_party_text());
    status_set("map", character.map + " " + Math.round(character.x) + "," + Math.round(character.y));
}


// =====================================================
// WINDOW CREATION
// =====================================================

function status_create_window() {
    var doc = status_get_document();

    if (!doc) {
        game_log("Status window could not find parent document.", "orange");
        return;
    }

    status_remove_window(STATUS_STATE.window_id);

    var window = doc.createElement("div");
    window.id = STATUS_STATE.window_id;

    var party_index = status_get_party_index();
    var top_position = 95 + party_index * 175;

    window.style.position = "fixed";
    window.style.left = "10px";
    window.style.top = top_position + "px";
    window.style.width = "245px";
    window.style.zIndex = "999999";
    window.style.padding = "10px";
    window.style.background = "rgba(8, 10, 18, 0.88)";
    window.style.border = "1px solid rgba(255, 255, 255, 0.25)";
    window.style.borderRadius = "8px";
    window.style.color = "white";
    window.style.fontFamily = "monospace";
    window.style.fontSize = "12px";
    window.style.lineHeight = "1.35";
    window.style.pointerEvents = "none";
    window.style.boxShadow = "0 0 12px rgba(0, 0, 0, 0.35)";

    window.innerHTML =
        "<div style='font-weight:bold; font-size:13px; color:#ffd36a; margin-bottom:6px;'>" +
            character.name + " [" + status_safe_role() + "]" +
        "</div>" +

        status_row("Gold/hr", "gold_hr") +
        status_row("XP/hr", "xp_hr") +
        status_row("Gold gained", "gold_gained") +
        status_row("XP gained", "xp_gained") +
        status_row("Runtime", "runtime") +
        status_row("HP / MP", "hp_mp") +
        status_row("Potions", "potions") +
        status_row("Free slots", "slots") +
        status_row("State", "state") +
        status_row("Target", "target") +
        status_row("Town", "town") +
        status_row("Party", "party") +
        status_row("Map", "map");

    doc.body.appendChild(window);
}

function status_row(label, key) {
    return (
        "<div style='display:flex; justify-content:space-between; gap:8px;'>" +
            "<span style='color:#b8b8b8;'>" + label + "</span>" +
            "<span id='" + status_element_id(key) + "'>...</span>" +
        "</div>"
    );
}

function status_remove_window(window_id) {
    var doc = status_get_document();

    if (!doc) {
        return;
    }

    var old_window = doc.getElementById(window_id);

    if (old_window) {
        old_window.remove();
    }
}

function status_get_document() {
    if (typeof parent === "undefined") {
        return null;
    }

    if (!parent.document) {
        return null;
    }

    return parent.document;
}

function status_element_id(key) {
    return "status_" + character.name + "_" + key;
}

function status_set(key, value) {
    var doc = status_get_document();

    if (!doc) {
        return;
    }

    var element = doc.getElementById(status_element_id(key));

    if (!element) {
        return;
    }

    element.textContent = value;
}


// =====================================================
// STATUS TEXT HELPERS
// =====================================================

function status_get_state_text() {
    if (character.rip) {
        return "Dead";
    }

    if (typeof TOWN_STATE !== "undefined" && TOWN_STATE.busy) {
        return "Town run";
    }

    if (typeof MOVEMENT_STATE !== "undefined" && MOVEMENT_STATE.is_stuck) {
        return "Stuck";
    }

    if (typeof movement_is_smart_moving === "function" && movement_is_smart_moving()) {
        return "Smart move";
    }

    var target = status_get_target();

    if (target) {
        return "Combat";
    }

    if (character.moving) {
        return "Moving";
    }

    if (typeof item_progression_has_work === "function" && item_progression_has_work()) {
        return "Has upgrades";
    }

    return "Idle";
}

function status_get_target_text() {
    var target = status_get_target();

    if (!target) {
        return "None";
    }

    var name = target.mtype || target.name || target.id || "Unknown";

    if (target.hp && target.max_hp) {
        var hp_percent = Math.round((target.hp / target.max_hp) * 100);
        return name + " " + hp_percent + "%";
    }

    return name;
}

function status_get_target() {
    var target = null;

    if (typeof get_targeted_monster === "function") {
        target = get_targeted_monster();
    }

    if (target && !target.dead) {
        return target;
    }

    if (
        typeof party_is_leader === "function" &&
        typeof movement_get_leader === "function" &&
        typeof get_target_of === "function" &&
        !party_is_leader()
    ) {
        var leader = movement_get_leader();

        if (leader) {
            target = get_target_of(leader);

            if (target && !target.dead) {
                return target;
            }
        }
    }

    return null;
}

function status_get_town_text() {
    if (typeof TOWN_STATE === "undefined") {
        return "Off";
    }

    if (TOWN_STATE.busy) {
        return TOWN_STATE.reason || "busy";
    }

    if (TOWN_STATE.requested) {
        return TOWN_STATE.reason || "requested";
    }

    return "No";
}

function status_get_party_text() {
    if (typeof party_get_current_members === "function") {
        var current_members = party_get_current_members();
        var expected_members = status_get_expected_party_count();

        return current_members.length + "/" + expected_members;
    }

    return "Unknown";
}

function status_get_potion_text() {
    var hp_potion = status_get_config_value("hp_potion", "hpot0");
    var mp_potion = status_get_config_value("mp_potion", "mpot0");

    return (
        status_get_item_quantity(hp_potion) +
        " HP | " +
        status_get_item_quantity(mp_potion) +
        " MP"
    );
}

function status_get_free_slots_text() {
    if (typeof inventory_free_slots === "function") {
        return inventory_free_slots();
    }

    return status_count_free_slots();
}


// =====================================================
// DATA HELPERS
// =====================================================

function status_get_config_value(key, fallback) {
    if (typeof CONFIG === "undefined") {
        return fallback;
    }

    if (!CONFIG) {
        return fallback;
    }

    if (CONFIG[key] === undefined) {
        return fallback;
    }

    return CONFIG[key];
}

function status_safe_role() {
    if (typeof CONFIG !== "undefined" && CONFIG && CONFIG.role) {
        return CONFIG.role;
    }

    if (character.ctype) {
        return character.ctype;
    }

    return "unknown";
}

function status_get_expected_party_count() {
    if (typeof PARTY !== "undefined" && PARTY.members && PARTY.members.length !== undefined) {
        return PARTY.members.length;
    }

    return 1;
}

function status_get_party_index() {
    if (typeof PARTY !== "undefined" && PARTY.members) {
        var index = PARTY.members.indexOf(character.name);

        if (index !== -1) {
            return index;
        }
    }

    return 0;
}

function status_get_item_quantity(item_name) {
    if (typeof inventory_item_quantity === "function") {
        return inventory_item_quantity(item_name);
    }

    var amount = 0;

    for (var i = 0; i < character.items.length; i++) {
        var item = character.items[i];

        if (!item) {
            continue;
        }

        if (item.name === item_name) {
            amount += item.q || 1;
        }
    }

    return amount;
}

function status_count_free_slots() {
    var count = 0;

    for (var i = 0; i < character.items.length; i++) {
        if (!character.items[i]) {
            count++;
        }
    }

    return count;
}


// =====================================================
// FORMAT HELPERS
// =====================================================

function status_format_number(value) {
    if (!isFinite(value)) {
        return "0";
    }

    var sign = "";

    if (value < 0) {
        sign = "-";
    }

    var abs_value = Math.abs(value);

    if (abs_value >= 1000000000) {
        return sign + (abs_value / 1000000000).toFixed(2) + "b";
    }

    if (abs_value >= 1000000) {
        return sign + (abs_value / 1000000).toFixed(2) + "m";
    }

    if (abs_value >= 10000) {
        return sign + Math.floor(abs_value).toLocaleString();
    }

    if (abs_value >= 1000) {
        return sign + Math.floor(abs_value).toLocaleString();
    }

    return sign + Math.floor(abs_value).toString();
}

function status_format_time(total_seconds) {
    total_seconds = Math.floor(total_seconds);

    var hours = Math.floor(total_seconds / 3600);
    var minutes = Math.floor((total_seconds % 3600) / 60);
    var seconds = total_seconds % 60;

    return (
        status_pad_time(hours) +
        ":" +
        status_pad_time(minutes) +
        ":" +
        status_pad_time(seconds)
    );
}

function status_pad_time(value) {
    if (value < 10) {
        return "0" + value;
    }

    return "" + value;
}