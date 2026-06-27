// =====================================================
// PARTY MODULE
// Reads PARTY and LEADER_NAME from each controller.
// If a controller does not define them, it falls back safely.
// =====================================================

if (typeof PARTY === "undefined") {
    var PARTY = [character.name];
}

if (typeof LEADER_NAME === "undefined") {
    var LEADER_NAME = character.name;
}


// =====================================================
// PARTY CHECKS
// =====================================================
function is_party_member(name) {
    return PARTY.indexOf(name) !== -1;
}


// =====================================================
// MAINTAIN PARTY
// =====================================================
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


// =====================================================
// PARTY EVENTS
// =====================================================
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


// =====================================================
// LEADER HELPERS
// =====================================================
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

    var follow_distance = 100;

    if (typeof CONFIG !== "undefined" && CONFIG.follow_distance) {
        follow_distance = CONFIG.follow_distance;
    }

    if (distance(character, leader) > follow_distance) {
        move(
            character.x + (leader.x - character.x) / 2,
            character.y + (leader.y - character.y) / 2
        );
    }
}


// =====================================================
// ASSIST LEADER
// Basic reusable combat assist.
// Ranger controller uses its own smarter version,
// but this is still useful for simple characters.
// =====================================================
function assist_leader() {
    var target = get_leader_target();

    if (!target || target.dead) {
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