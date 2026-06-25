var PARTY = ["PopeRaoul" , "KrisAngel"];
var LEADER_NAME = "KrisAngel";




function is_party_member(name) {
	return PARTY.indexOf(name) !== -1;
}

function maintain_party() {
	if (character.name === LEADER_NAME) {
		for (var i = 0; i < PARTY.length; i++) {
			var name = PARTY[i];

			if (name !== character.name) {
				send_party_invite(name);
			}
		}
	} else {
		if (!character.party) {
			send_party_request(LEADER_NAME);
		}
	}
}

function on_party_invite(name) {
	if (is_party_member(name)) {
		accept_party_invite(name);
	}
}

function on_party_request(name) {
	if (is_party_member(name)) {
		accept_party_request(name);
	}
}

function get_leader() {
	return get_player(LEADER_NAME);
}

function get_leader_target() {
	var leader = get_leader();

	if (!leader) {
		return null;
	}

	return get_target_of(leader);
}

function move_near_leader() {
	var leader = get_leader();

	if (!leader) {
		set_message("No leader");
		return;
	}

	if (distance(character, leader) > 100) {
		move(
			character.x + (leader.x - character.x) / 2,
			character.y + (leader.y - character.y) / 2
		);
	}
}

function assist_leader() {
	var target = get_leader_target();

	if (!target) {
		set_message("No leader target");
		move_near_leader();
		return;
	}

	change_target(target);

	if (!is_in_range(target)) {
		set_message("Following target");
		move(
			character.x + (target.x - character.x) / 2,
			character.y + (target.y - character.y) / 2
		);
		return;
	}

	if (can_attack(target)) {
		set_message("Assisting leader");
		attack(target);
	}
}