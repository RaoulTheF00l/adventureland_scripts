// =====================================================
// ROLE MAGE MODULE
// Class-specific behavior for mage characters.
//
// Job:
// - If leader, choose and attack targets.
// - If not leader, assist the leader.
// - Move toward the monster area when idle.
// - Leave room for mage-specific skills later.
// =====================================================


// =====================================================
// PUBLIC ROLE LOOP
// Called by PartyRunner when CONFIG.role === "mage".
// =====================================================

function role_mage_loop() {
    if (party_is_leader()) {
        role_mage_leader_loop();
        return;
    }

    role_mage_assist_loop();
}


// =====================================================
// LEADER MAGE LOGIC
// Mage leader controls the party's target flow.
// =====================================================

function role_mage_leader_loop() {
    var did_attack = combat_leader_loop();

    if (did_attack) {
        return true;
    }

    if (CONFIG.move_to_monster_when_idle === true) {
        role_mage_move_to_farm_area();
        return false;
    }

    set_message("Mage idle");
    return false;
}


// =====================================================
// ASSIST MAGE LOGIC
// Useful if you ever run this script on a non-leader mage.
// =====================================================

function role_mage_assist_loop() {
    combat_assist_leader();
}


// =====================================================
// FARM AREA MOVEMENT
// If the leader has no target, go toward the configured monster.
// =====================================================

function role_mage_move_to_farm_area() {
    if (movement_is_smart_moving()) {
        set_message("Moving to " + CONFIG.monster);
        return;
    }

    set_message("Seeking " + CONFIG.monster);
    movement_smart_move(CONFIG.monster);
}