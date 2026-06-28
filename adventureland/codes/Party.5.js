// =====================================================
// PARTY MODULE
// Handles party membership and invite/request behavior.
//
// Job:
// - Know who the leader is.
// - Know who belongs to the party.
// - Keep the party formed.
// - Accept only trusted party members.
// =====================================================


// =====================================================
// PARTY STATE
// Internal memory for this module.
// =====================================================

var PARTY_STATE = {
    last_check: 0
};


// =====================================================
// PARTY IDENTITY HELPERS
// These answer simple questions about the current character.
// =====================================================

function party_is_leader() {
    return character.name === PARTY.leader;
}

function party_is_member(name) {
    if (!PARTY || !PARTY.members) {
        return false;
    }

    return PARTY.members.indexOf(name) !== -1;
}

function party_is_in_party() {
    return !!character.party;
}

function party_get_leader_name() {
    return PARTY.leader;
}

function party_get_members() {
    return PARTY.members;
}


function party_get_current_members() {
    if (
        typeof parent !== "undefined" &&
        parent.party_list &&
        parent.party_list.length !== undefined
    ) {
        return parent.party_list;
    }

    return [];
}

function party_is_currently_with_us(name) {
    var current_members = party_get_current_members();

    return current_members.indexOf(name) !== -1;
}

function party_is_full() {
    var current_members = party_get_current_members();

    return current_members.length >= PARTY.members.length;
}




// =====================================================
// PARTY MAINTENANCE
// Called by PartyRunner every loop.
// Internally throttled so it only acts every few seconds.
// =====================================================

function party_maintain() {
    var now = Date.now();

    if (now - PARTY_STATE.last_check < PARTY.party_check_ms) {
        return;
    }

    PARTY_STATE.last_check = now;

    if (party_is_leader()) {
        party_leader_maintain();
        return;
    }

    party_member_maintain();
}


// =====================================================
// LEADER BEHAVIOR
// The leader invites trusted party members.
// =====================================================

function party_leader_maintain() {
    if (party_is_full()) {
        set_message("Party ready");
        return;
    }

    for (var i = 0; i < PARTY.members.length; i++) {
        var member_name = PARTY.members[i];

        if (member_name === character.name) {
            continue;
        }

        if (party_is_currently_with_us(member_name)) {
            continue;
        }

        party_invite_member(member_name);
    }
}

function party_invite_member(member_name) {
    if (!party_is_member(member_name)) {
        return;
    }

    game_log("Inviting " + member_name, "cyan");
    send_party_invite(member_name);
}


// =====================================================
// NON-LEADER BEHAVIOR
// Non-leaders request an invite from the leader if needed.
// =====================================================

function party_member_maintain() {
    if (party_is_in_party()) {
        return;
    }

    var leader_name = party_get_leader_name();

    if (!leader_name) {
        game_log("No party leader configured.", "red");
        return;
    }

    game_log("Requesting party invite from " + leader_name, "cyan");
    send_party_request(leader_name);
}


// =====================================================
// ADVENTURE LAND EVENT HANDLERS
// These are called by the game when invites/requests happen.
// =====================================================

function on_party_invite(name) {
    if (!party_is_member(name)) {
        game_log("Rejected party invite from " + name, "orange");
        return;
    }

    if (name !== PARTY.leader) {
        game_log("Rejected non-leader invite from " + name, "orange");
        return;
    }

    game_log("Accepted party invite from " + name, "green");
    accept_party_invite(name);
}

function on_party_request(name) {
    if (!party_is_leader()) {
        return;
    }

    if (!party_is_member(name)) {
        game_log("Rejected party request from " + name, "orange");
        return;
    }

    game_log("Accepted party request from " + name, "green");
    accept_party_request(name);
}