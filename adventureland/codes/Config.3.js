// =====================================================
// CONFIG MODULE
// Data only.
// This file describes the party and each character.
// =====================================================


// =====================================================
// PARTY DATA
// =====================================================

var PARTY = {
    leader: "KrisAngel",

    members: [
        "KrisAngel",
        "PopeRaoul",
        "KrisRanger"
    ],

    default_monster: "bee"
};

// =====================================================
// CHARACTER DATA
// =====================================================

var CHARACTER_CONFIGS = {
    KrisAngel: {
        role: "mage",
        monster: "bee",
        loop_ms: 100
    },

    PopeRaoul: {
        role: "mage",
        monster: "bee",
        loop_ms: 100
    },

    KrisRanger: {
        role: "ranger",
        monster: "bee",
        loop_ms: 100
    }
};

// =====================================================
// CONFIG ACCESS
// =====================================================

function get_config_for_character(name) {
    var config = CHARACTER_CONFIGS[name];

    if (!config) {
        game_log("No config found for " + name, "red");

        return {
            role: "unknown",
            monster: PARTY.default_monster,
            loop_ms: 250
        };
    }

    return config;
}