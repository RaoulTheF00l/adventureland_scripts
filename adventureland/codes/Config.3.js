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

    default_monster: "bee",

    party_check_ms: 5000,

    town_request_cooldown_ms: 10000,
    town_run_cooldown_ms: 15000,
    town_wait_for_party_ms: 1500
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
    mp_potion_use_at: 0.35,

    follow_distance: 80,
    far_distance: 250,

    attack_enabled: true,
    attack_distance: 90,

    move_to_monster_when_idle: true,
    mage_use_specials: false,

    auto_compound: true,
    compound_scroll: "cscroll0",
    compound_gold_floor: 30000,
    compound_max_level: 1,
    compound_items: [
        "hpamulet",
        "hpbelt",
        "ringsj"
    ],

    town_enabled: true,
    free_slots_before_town: 6,
    
    hp_potion: "hpot0",
    mp_potion: "mpot0",
    desired_hp_potions: 100,
    desired_mp_potions: 150,
    minimum_hp_potions: 10,
    minimum_mp_potions: 10,
    
    sell_unknown_items: false,

    sell_list: [
            "beewings"
        ],

    keep_items: [
        "hpot0", "mpot0", "hpot1", "mpot1",
        "scroll0", "scroll1", "scroll2",
        "cscroll0", "cscroll1", "cscroll2",
        "offering",
        "xpbooster", "luckbooster", "goldbooster",
        "computer", "stand0"
    ],

    run_item_progression_in_town: true

    },

    PopeRaoul: {
        role: "priest",
        monster: "bee",
        loop_ms: 250,

        auto_respawn: true,

        use_hp_potions: true,
        use_mp_potions: true,
        hp_potion_use_at: 0.60,
        mp_potion_use_at: 0.40,

        follow_distance: 90,
        far_distance: 250,


        attack_enabled: true,
        attack_distance: 80,

        auto_compound: true,
        compound_scroll: "cscroll0",
        compound_gold_floor: 30000,
        compound_max_level: 1,
        compound_items: [
            "hpamulet"
        ],

        town_enabled: true,
        free_slots_before_town: 6,

        hp_potion: "hpot0",
        mp_potion: "mpot0",
        desired_hp_potions: 75,
        desired_mp_potions: 200,
        minimum_hp_potions: 10,
        minimum_mp_potions: 15,

        sell_unknown_items: false,

        sell_list: [
                "beewings"
            ],

    keep_items: [
        "hpot0", "mpot0", "hpot1", "mpot1",
        "scroll0", "scroll1", "scroll2",
        "cscroll0", "cscroll1", "cscroll2",
        "offering",
        "xpbooster", "luckbooster", "goldbooster",
        "computer", "stand0"
    ],

    run_item_progression_in_town: true
    
    },
    
    KrisRanger: {
        role: "ranger",
        monster: "bee",
        loop_ms: 250,

        auto_respawn: true,

        use_hp_potions: true,
        use_mp_potions: true,
        hp_potion_use_at: 0.50,
        mp_potion_use_at: 0.35,

        follow_distance: 110,
        far_distance: 280,

        attack_enabled: true,
        attack_distance: 120,

        use_supershot: false,
        supershot_min_mp: 120,
        supershot_only_above_hp: 0.30,

        auto_compound: true,
        compound_scroll: "cscroll0",
        compound_gold_floor: 30000,
        compound_max_level: 1,
        compound_items: [
            "hpamulet"
        ],

            town_enabled: true,
            free_slots_before_town: 6,
    
            hp_potion: "hpot0",
            mp_potion: "mpot0",
            desired_hp_potions: 100,
            desired_mp_potions: 150,
            minimum_hp_potions: 10,
            minimum_mp_potions: 10,
    
            sell_unknown_items: false,

            sell_list: [
                "beewings"
            ],

        keep_items: [
            "hpot0", "mpot0", "hpot1", "mpot1",
            "scroll0", "scroll1", "scroll2",
            "cscroll0", "cscroll1", "cscroll2",
            "offering",
            "xpbooster", "luckbooster", "goldbooster",
            "computer", "stand0"
        ],

        run_item_progression_in_town: true
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