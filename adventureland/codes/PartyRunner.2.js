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
    if (character.rip) {
        set_message("Dead");
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

    set_message("Unknown role");
}


// =====================================================
// TEMPORARY ROLE PLACEHOLDERS
// These prove role routing works 
// =====================================================

function runner_mage_placeholder() {
    set_message("Mage ready");
}

function runner_priest_placeholder() {
    set_message("Priest ready");
}

function runner_ranger_placeholder() {
    set_message("Ranger ready");
}