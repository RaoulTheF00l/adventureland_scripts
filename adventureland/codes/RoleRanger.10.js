// =====================================================
// ROLE RANGER MODULE
// Class-specific behavior for ranger characters.
//
// Job:
// - Assist the leader's target.
// - Keep ranger spacing.
// - Use normal attacks.
// - Optionally use supershot later.
// =====================================================


// =====================================================
// PUBLIC ROLE LOOP
// Called by PartyRunner when CONFIG.role === "ranger".
// =====================================================

function role_ranger_loop() {
    var target = role_ranger_get_target();

    if (!combat_is_valid_target(target)) {
        set_message("Ranger follow");
        movement_follow_leader();
        return false;
    }

    change_target(target);

    if (role_ranger_try_supershot(target)) {
        return true;
    }

    return combat_attack_target(target, "Ranger attacking");
}

// =====================================================
// TARGET SELECTION
// Ranger should assist the leader.
// =====================================================

function role_ranger_get_target() {
    var target = combat_get_leader_target();

    if (combat_is_valid_target(target)) {
        return target;
    }

    return null;
}


// =====================================================
// RANGER SKILLS
// Supershot is optional and disabled by default in Config.
// =====================================================

function role_ranger_try_supershot(target) {
    if (CONFIG.use_supershot !== true) {
        return false;
    }

    if (!target) {
        return false;
    }

    if (!combat_is_valid_target(target)) {
        return false;
    }

    if (character.mp < (CONFIG.supershot_min_mp || 120)) {
        return false;
    }

    if (!target.hp || !target.max_hp) {
        return false;
    }

    var target_hp_ratio = target.hp / target.max_hp;

    if (target_hp_ratio < (CONFIG.supershot_only_above_hp || 0.30)) {
        return false;
    }

    if (!is_in_range(target)) {
        movement_move_near_entity(
            target,
            CONFIG.attack_distance || 120
        );

        return true;
    }

    if (!core_skill_ready("supershot")) {
        return false;
    }

    if (typeof use_skill !== "function") {
        return false;
    }

    set_message("Supershot");
    use_skill("supershot", target);

    return true;
}