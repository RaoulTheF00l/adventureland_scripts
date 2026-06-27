// =====================================================
// CORE MODULE
// Universal behavior used by every character.
//
// Job:
// - Handle death / respawn.
// - Use HP and MP potions.
// - Provide small shared helper functions.
// =====================================================


// =====================================================
// DEATH HANDLING
// =====================================================

function core_handle_death() {
    if (!character.rip) {
        return false;
    }

    set_message("Dead");

    if (CONFIG.auto_respawn !== true) {
        return true;
    }

    if (typeof respawn === "function") {
        set_message("Respawning");
        respawn();
    }

    return true;
}


// =====================================================
// POTION HANDLING
// =====================================================

function core_use_potions() {
    core_use_hp_potion_if_needed();
    core_use_mp_potion_if_needed();
}

function core_use_hp_potion_if_needed() {
    if (CONFIG.use_hp_potions !== true) {
        return;
    }

    if (!CONFIG.hp_potion_use_at) {
        return;
    }

    var hp_ratio = character.hp / character.max_hp;

    if (hp_ratio > CONFIG.hp_potion_use_at) {
        return;
    }

    if (!core_skill_ready("use_hp")) {
        return;
    }

    set_message("HP potion");
    use_skill("use_hp");
}

function core_use_mp_potion_if_needed() {
    if (CONFIG.use_mp_potions !== true) {
        return;
    }

    if (!CONFIG.mp_potion_use_at) {
        return;
    }

    var mp_ratio = character.mp / character.max_mp;

    if (mp_ratio > CONFIG.mp_potion_use_at) {
        return;
    }

    if (!core_skill_ready("use_mp")) {
        return;
    }

    set_message("MP potion");
    use_skill("use_mp");
}


// =====================================================
// SHARED HELPERS
// =====================================================

function core_skill_ready(skill_name) {
    if (typeof is_on_cooldown !== "function") {
        return true;
    }

    return !is_on_cooldown(skill_name);
}

function core_delay(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}