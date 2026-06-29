// =====================================================
// PARTY RUNNER
// This script runs on every character.
//
// Job:
// - Load shared modules.
// - Read this character's config.
// - Start one clean main loop.
// - Route behavior based on role.
// =====================================================


// =====================================================
// CLEAN RESTART GUARD
// Prevents duplicate loops if PartyRunner is loaded again.
// =====================================================

if (typeof PARTY_RUNNER_INTERVAL !== "undefined" && PARTY_RUNNER_INTERVAL) {
    clearInterval(PARTY_RUNNER_INTERVAL);
    game_log("Cleared old PartyRunner loop.", "orange");
}


// =====================================================
// LOAD MODULES
// =====================================================

load_code("Config");

if (typeof get_config_for_character !== "function") {
    set_message("Config missing");
    game_log("Config did not load correctly. Check Config.", "red");
    throw new Error("Config module failed to load.");
}

load_code("Core");

if (typeof core_handle_death !== "function") {
    set_message("Core missing");
    game_log("Core did not load correctly. Check Core.", "red");
    throw new Error("Core module failed to load.");
}

load_code("Party");

if (typeof party_maintain !== "function") {
    set_message("Party missing");
    game_log("Party did not load correctly. Check Party.", "red");
    throw new Error("Party module failed to load.");
}

load_code("Movement");

if (typeof movement_update !== "function") {
    set_message("Movement missing");
    game_log("Movement did not load correctly. Check Movement.", "red");
    throw new Error("Movement module failed to load.");
}

load_code("Town");

if (typeof town_update !== "function") {
    set_message("Town missing");
    game_log("Town did not load correctly. Check Town.", "red");
    throw new Error("Town module failed to load.");
}

load_code("Status");

if (typeof status_update !== "function") {
    set_message("Status missing");
    game_log("Status did not load correctly. Check Status.", "red");
    throw new Error("Status module failed to load.");
}


load_code("ItemProgression");

if (typeof item_progression_has_work !== "function") {
    set_message("ItemProgression missing");
    game_log("ItemProgression did not load correctly. Check ItemProgression.", "red");
    throw new Error("ItemProgression module failed to load.");
}


load_code("Combat");

if (typeof combat_leader_loop !== "function") {
    set_message("Combat missing");
    game_log("Combat did not load correctly. Check Combat.", "red");
    throw new Error("Combat module failed to load.");
}


load_code("Inventory");

if (typeof inventory_loot !== "function") {
    set_message("Inventory missing");
    game_log("Inventory did not load correctly. Check Inventory.", "red");
    throw new Error("Inventory module failed to load.");
}


load_code("RolePriest");

if (typeof role_priest_loop !== "function") {
    set_message("RolePriest missing");
    game_log("RolePriest did not load correctly. Check RolePriest.", "red");
    throw new Error("RolePriest module failed to load.");
}


load_code("RoleRanger");

if (typeof role_ranger_loop !== "function") {
    set_message("RoleRanger missing");
    game_log("RoleRanger did not load correctly. Check RoleRanger.", "red");
    throw new Error("RoleRanger module failed to load.");
}


load_code("RoleMage");

if (typeof role_mage_loop !== "function") {
    set_message("RoleMage missing");
    game_log("RoleMage did not load correctly. Check RoleMage.", "red");
    throw new Error("RoleMage module failed to load.");
}

load_code("RoleMerchant");

if (typeof role_merchant_loop !== "function") {
    set_message("RoleMerchant missing");
    game_log("RoleMerchant did not load correctly. Check RoleMerchant.", "red");
    throw new Error("RoleMerchant module failed to load.");
}


// =====================================================
// ACTIVE CHARACTER CONFIG
// =====================================================

var CONFIG = get_config_for_character(character.name);


// =====================================================
// STARTUP LOG
// =====================================================

game_log(
    "PartyRunner active on " +
    character.name +
    " | role: " +
    CONFIG.role +
    " | monster: " +
    CONFIG.monster,
    "green"
);

set_message(CONFIG.role + " ready");


// =====================================================
// START MAIN LOOP
// =====================================================

var PARTY_RUNNER_INTERVAL = setInterval(party_runner_loop, CONFIG.loop_ms);


// =====================================================
// MAIN LOOP
// =====================================================

function party_runner_loop() {
    if (core_handle_death()) {
        return;
    }

    inventory_loot();
    core_use_potions();
    party_maintain();
    movement_update();

    merchant_support_update();

    if (town_update()) {
        return;
    }

    if (CONFIG.role === "mage") {
        runner_mage_placeholder();
        return;
    }

    if (CONFIG.role === "priest") {
        runner_priest_placeholder();
        return;
    }

    if (CONFIG.role === "ranger") {
        runner_ranger_placeholder();
        return;
    }

    if (CONFIG.role === "merchant") {
        role_merchant_loop();
        return;
    }

    set_message("Unknown role");
}


// =====================================================
// TEMPORARY ROLE PLACEHOLDERS
// These prove role routing works 
// =====================================================

function runner_mage_placeholder() {
    role_mage_loop();
}

function runner_priest_placeholder() {
    role_priest_loop();
}

function runner_ranger_placeholder() {
    role_ranger_loop();
}