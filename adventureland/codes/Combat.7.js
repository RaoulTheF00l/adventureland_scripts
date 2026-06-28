// =====================================================
// COMBAT MODULE
// Shared combat helpers used by role modules.
//
// Job:
// - Find valid monsters.
// - Let the leader select a target.
// - Let party members assist the leader.
// - Move into range using Movement.
// - Attack safely when ready.
// =====================================================


// =====================================================
// LEADER COMBAT
// Used by the party leader.
// =====================================================

function combat_leader_loop() {
    if (CONFIG.attack_enabled !== true) {
        set_message("Attack disabled");
        return false;
    }

    var target = combat_get_current_target();

    if (!combat_is_valid_target(target)) {
        target = combat_find_nearest_target();

        if (target) {
            change_target(target);
        }
    }

    if (!target) {
        set_message("No " + CONFIG.monster);
        return false;
    }

    return combat_attack_target(target, "Leader attacking");
}


// =====================================================
// ASSIST COMBAT
// Used by non-leader characters.
// They try to attack the leader's current target.
// =====================================================

function combat_assist_leader() {
    if (CONFIG.attack_enabled !== true) {
        set_message("Attack disabled");
        return false;
    }

    var target = combat_get_leader_target();

    if (!combat_is_valid_target(target)) {
        set_message("No leader target");
        movement_follow_leader();
        return false;
    }

    change_target(target);

    return combat_attack_target(target, CONFIG.role + " assisting");
}


// =====================================================
// ATTACK EXECUTION
// This is the actual "move into range and attack" helper.
// =====================================================

function combat_attack_target(target, message) {
    if (!combat_is_valid_target(target)) {
        return false;
    }

    if (!is_in_range(target)) {
        set_message("Moving to target");

        movement_move_near_entity(
            target,
            CONFIG.attack_distance || 90
        );

        return false;
    }

    if (!can_attack(target)) {
        set_message("Attack cooldown");
        return false;
    }

    set_message(message);
    attack(target);

    return true;
}


// =====================================================
// TARGET FINDING
// =====================================================

function combat_get_current_target() {
    if (typeof get_targeted_monster !== "function") {
        return null;
    }

    return get_targeted_monster();
}

function combat_find_nearest_target() {
    if (typeof get_nearest_monster !== "function") {
        return null;
    }

    return get_nearest_monster({
        type: CONFIG.monster
    });
}

function combat_get_leader_target() {
    var leader = movement_get_leader();

    if (!leader) {
        return null;
    }

    if (typeof get_target_of !== "function") {
        return null;
    }

    return get_target_of(leader);
}


// =====================================================
// TARGET VALIDATION
// Keeps us from attacking the wrong thing.
// =====================================================

function combat_is_valid_target(target) {
    if (!target) {
        return false;
    }

    if (target.dead) {
        return false;
    }

    if (target.type !== "monster") {
        return false;
    }

    if (target.mtype !== CONFIG.monster) {
        return false;
    }

    return true;
}