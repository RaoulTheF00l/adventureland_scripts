// =====================================================
// ADVENTURE LAND BEGINNER FIGHTER BOT
// =====================================================

var attack_mode = true;

var START_GOLD = character.gold;
var START_TIME = new Date();

var CONFIG = {
	monster_type: "bee",
	loop_speed_ms: 250,
	move_fraction: 2
};




// =====================================================
// COUNTERS
// =====================================================

function show_gold_progress() {
	var minutes = (new Date() - START_TIME)/60000;
	var gold_gained = character.gold - START_GOLD;
	
	if(minutes <- 0) {
		return;
	}
	
	var gold_per_minute = Math.round(gold_gained / minutes)
	
	set_message("GPM: " + gold_per_minute);
}


// =====================================================
// POTION HELPERS
// =====================================================

function hp_percent() {
	return character.hp / character.max_hp;
}

function mp_percent() {
	return character.mp / character.max_mp;
}

function missing_hp() {
	return character.max_hp - character.hp;
}

function missing_mp() {
	return character.max_mp - character.mp;
}

function manage_potions() {
	if (hp_percent() < 0.35 && !is_on_cooldown("use_hp")) {
		set_message("Emergency HP");
		use_skill("use_hp");
		return;
	}

	if (hp_percent() < 0.65 && missing_hp() > 150 && !is_on_cooldown("use_hp")) {
		set_message("Using HP");
		use_skill("use_hp");
		return;
	}

	if (mp_percent() < 0.40 && missing_mp() > 100 && !is_on_cooldown("use_mp")) {
		set_message("Using MP");
		use_skill("use_mp");
		return;
	}
}

// =====================================================
// BASIC STATUS CHECKS
// =====================================================

function is_character_busy() {
	return character.rip || is_moving(character);
}

function do_maintenance() {
	manage_potions();
	loot();
}

// =====================================================
// TARGETING
// =====================================================

function find_target() {
	var target = get_targeted_monster();

	if (target) {
		return target;
	}

	target = get_nearest_monster({
		type: CONFIG.monster_type
	});

	if (target) {
		change_target(target);
	}

	return target;
}

// =====================================================
// MOVEMENT
// =====================================================

function move_toward(target) {
	move(
		character.x + (target.x - character.x) / CONFIG.move_fraction,
		character.y + (target.y - character.y) / CONFIG.move_fraction
	);
}

// =====================================================
// COMBAT
// =====================================================

function fight_target(target) {
	if (!is_in_range(target)) {
		set_message("Moving");
		move_toward(target);
		return;
	}

	if (can_attack(target)) {
		set_message("Attacking " + target.name);
		attack(target);
	}
}

// =====================================================
// SKILL HELPERS
// =====================================================

function use_poison_skill(target) {
	if(is_in_range(target) && (character.mp >= 0.35)) {
		set_message("Poison Arrow");
	}		
}

// =====================================================
// MAIN LOOP
// =====================================================

function main_loop() {
	show_gold_progress();
	do_maintenance();
	

	if (!attack_mode) {
		set_message("Paused");
		return;
	}

	if (is_character_busy()) {
		return;
	}

	var target = find_target();

	if (!target) {
		set_message("No target");
		return;
	}

	fight_target(target);
}

setInterval(main_loop, CONFIG.loop_speed_ms);