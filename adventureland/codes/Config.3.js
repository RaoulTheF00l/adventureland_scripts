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
        loop_ms: 250,

        auto_respawn: true,

        use_hp_potions: true,
        use_mp_potions: true,
        hp_potion_use_at: 0.50,
        mp_potion_use_at: 0.35
    },

    PopeRaoul: {
        role: "priest",
        monster: "bee",
        loop_ms: 250,

        auto_respawn: true,

        use_hp_potions: true,
        use_mp_potions: true,
        hp_potion_use_at: 0.60,
        mp_potion_use_at: 0.40
    },

    KrisRanger: {
        role: "ranger",
        monster: "bee",
        loop_ms: 250,

        auto_respawn: true,

        use_hp_potions: true,
        use_mp_potions: true,
        hp_potion_use_at: 0.50,
        mp_potion_use_at: 0.35
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
            loop_ms: 250,

            auto_respawn: false,

            use_hp_potions: false,
            use_mp_potions: false,
            hp_potion_use_at: 0.50,
            mp_potion_use_at: 0.35
        };
    }

    return config;
}