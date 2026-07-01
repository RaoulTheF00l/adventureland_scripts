// =====================================================
// PARTY BOOT
// Run this manually on your main character.
//
// Job:
// - Start the other party characters.
// - Tell them to run PartyRunner.
// - Load PartyRunner on this character too.
// =====================================================


// =====================================================
// BOOT CONFIG
// =====================================================

var BOOT = {
    runner_code: "PartyRunner",

    leader: "MageRao",

    characters: [
        "MageRao",
        "PriestRao",
        "RangerRao",
		"MerchantRao"
    ]
};


// =====================================================
// BOOT START
// =====================================================

boot_party();


// =====================================================
// BOOT LOGIC
// =====================================================

function boot_party() {
    game_log("Booting party...", "cyan");

    for (var i = 0; i < BOOT.characters.length; i++) {
        var name = BOOT.characters[i];

        if (name === character.name) {
            continue;
        }

        start_party_character(name);
    }

    game_log("Loading runner on " + character.name, "cyan");

    load_code(BOOT.runner_code);
}

function start_party_character(name) {
    game_log("Starting " + name + " with " + BOOT.runner_code, "cyan");

    start_character(name, BOOT.runner_code);
}