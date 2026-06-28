// =====================================================
// ROLE PRIEST MODULE
// Class-specific behavior for priest characters.
//
// Job:
// - Heal self.
// - Heal party members.
// - Prioritize the lowest HP target.
// - Assist combat when nobody needs healing.
// =====================================================


// =====================================================
// PUBLIC ROLE LOOP
// Called by PartyRunner when CONFIG.role === "priest".
// =====================================================

function role_priest_loop() {
    if (CONFIG.heal_enabled !== true) {
        combat_assist_leader();
        return;
    }

    var heal_target = role_priest_get_heal_target();

    if (heal_target) {
        role_priest_heal_target(heal_target);
        return;
    }

    if (CONFIG.assist_when_idle === true) {
        combat_assist_leader();
        return;
    }

    movement_follow_leader();
}


// =====================================================
// HEAL TARGET SELECTION
// Finds the lowest HP party member who needs healing.
// =====================================================

function role_priest_get_heal_target() {
    var lowest_target = null;
    var lowest_ratio = 1;

    for (var i = 0; i < PARTY.members.length; i++) {
        var member_name = PARTY.members[i];
        var member = role_priest_get_party_member(member_name);

        if (!member) {
            continue;
        }

        if (member.rip) {
            continue;
        }

        if (!member.hp || !member.max_hp) {
            continue;
        }

        var hp_ratio = member.hp / member.max_hp;
        var heal_threshold = CONFIG.party_heal_at || 0.80;

        if (member.name === character.name) {
            heal_threshold = CONFIG.self_heal_at || 0.90;
        }

        if (hp_ratio <= heal_threshold && hp_ratio < lowest_ratio) {
            lowest_target = member;
            lowest_ratio = hp_ratio;
        }
    }

    return lowest_target;
}

function role_priest_get_party_member(name) {
    if (name === character.name) {
        return character;
    }

    return get_player(name);
}


// =====================================================
// HEAL EXECUTION
// Moves into range and heals the target.
// =====================================================

function role_priest_heal_target(target) {
    if (!target) {
        return false;
    }

    if (character.mp < (CONFIG.min_mp_to_heal || 80)) {
        set_message("Need MP");
        movement_follow_leader();
        return false;
    }

    if (!is_in_range(target)) {
        set_message("Moving to heal");

        movement_move_near_entity(
            target,
            CONFIG.heal_distance || 80
        );

        return false;
    }

    if (typeof can_heal === "function") {
        if (!can_heal(target)) {
            set_message("Heal cooldown");
            return false;
        }
    }

    set_message("Healing " + target.name);
    heal(target);

    return true;
}