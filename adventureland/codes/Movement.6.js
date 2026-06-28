// =====================================================
// MOVEMENT MODULE
// Handles safe following and basic anti-stuck recovery.
//
// Job:
// - Follow the party leader.
// - Move near entities safely.
// - Avoid direct-move wall shoving.
// - Detect when movement is stuck.
// - Try simple recovery behavior.
// =====================================================


// =====================================================
// MOVEMENT STATE
// Internal memory for stuck detection.
// =====================================================

var MOVEMENT_STATE = {
    last_x: character.x,
    last_y: character.y,

    last_check: Date.now(),
    last_smart_move: 0,
    last_recovery: 0,

    wanted_move: false,
    stuck_ticks: 0,
    is_stuck: false
};


// =====================================================
// PUBLIC UPDATE
// Called once per PartyRunner loop.
// =====================================================

function movement_update() {
    movement_track_stuck();
}


// =====================================================
// LEADER FOLLOWING
// This is the main function role modules can call.
// =====================================================

function movement_follow_leader() {
    if (party_is_leader()) {
        return true;
    }

    var leader = movement_get_leader();

    if (!leader) {
        set_message("Finding leader");
        movement_smart_move(CONFIG.monster);
        return false;
    }

    return movement_move_near_entity(
        leader,
        CONFIG.follow_distance || 90
    );
}


// =====================================================
// ENTITY MOVEMENT
// Move near a target without standing directly on top of it.
// =====================================================

function movement_move_near_entity(entity, desired_distance) {
    if (!entity) {
        return false;
    }

    var current_distance = movement_distance(character, entity);

    if (current_distance <= desired_distance) {
        MOVEMENT_STATE.wanted_move = false;
        MOVEMENT_STATE.stuck_ticks = 0;
        MOVEMENT_STATE.is_stuck = false;

        return true;
    }

    MOVEMENT_STATE.wanted_move = true;

    if (MOVEMENT_STATE.is_stuck) {
        movement_recover(entity);
        return false;
    }

    if (current_distance >= (CONFIG.far_distance || 250)) {
        set_message("Far follow");
        movement_smart_move({
            map: entity.map || character.map,
            x: entity.x,
            y: entity.y
        });

        return false;
    }

    set_message("Following");

    var destination = movement_get_point_near_entity(entity, desired_distance);

    movement_direct_move_to(destination.x, destination.y);

    return false;
}


// =====================================================
// POSITION MATH
// Calculates a point near the entity instead of inside it.
// =====================================================

function movement_get_point_near_entity(entity, desired_distance) {
    var dx = entity.x - character.x;
    var dy = entity.y - character.y;

    var length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
        return {
            x: character.x,
            y: character.y
        };
    }

    var unit_x = dx / length;
    var unit_y = dy / length;

    return {
        x: entity.x - unit_x * desired_distance,
        y: entity.y - unit_y * desired_distance
    };
}


// =====================================================
// DIRECT MOVEMENT
// Uses move(), but checks can_move_to() when available.
// =====================================================

function movement_direct_move_to(x, y) {
    if (typeof can_move_to === "function") {
        if (!can_move_to(x, y)) {
            set_message("Path blocked");
            movement_smart_move({
                map: character.map,
                x: x,
                y: y
            });

            return false;
        }
    }

    move(x, y);
    return true;
}


// =====================================================
// SMART MOVE WRAPPER
// Prevents smart_move spam.
// =====================================================

function movement_smart_move(destination) {
    var now = Date.now();

    if (movement_is_smart_moving()) {
        return false;
    }

    if (now - MOVEMENT_STATE.last_smart_move < 3000) {
        return false;
    }

    MOVEMENT_STATE.last_smart_move = now;

    var result = smart_move(destination);

    if (result && result.catch) {
        result.catch(function (error) {
            game_log("smart_move failed: " + error, "orange");
        });
    }

    return true;
}

function movement_is_smart_moving() {
    return typeof smart !== "undefined" && smart.moving;
}


// =====================================================
// STUCK DETECTION
// Checks whether the character wanted to move but barely moved.
// =====================================================

function movement_track_stuck() {
    var now = Date.now();

    if (now - MOVEMENT_STATE.last_check < 1000) {
        return;
    }

    var moved_distance = movement_distance_points(
        character.x,
        character.y,
        MOVEMENT_STATE.last_x,
        MOVEMENT_STATE.last_y
    );

    MOVEMENT_STATE.last_x = character.x;
    MOVEMENT_STATE.last_y = character.y;
    MOVEMENT_STATE.last_check = now;

    if (!MOVEMENT_STATE.wanted_move) {
        MOVEMENT_STATE.stuck_ticks = 0;
        MOVEMENT_STATE.is_stuck = false;
        return;
    }

    if (movement_is_smart_moving()) {
        MOVEMENT_STATE.stuck_ticks = 0;
        MOVEMENT_STATE.is_stuck = false;
        return;
    }

    if (moved_distance < 5) {
        MOVEMENT_STATE.stuck_ticks++;
    } else {
        MOVEMENT_STATE.stuck_ticks = 0;
        MOVEMENT_STATE.is_stuck = false;
    }

    if (MOVEMENT_STATE.stuck_ticks >= 3) {
        MOVEMENT_STATE.is_stuck = true;
        game_log("Movement stuck detected.", "orange");
    }
}


// =====================================================
// RECOVERY
// If stuck, try a small nudge before falling back to smart_move.
// =====================================================

function movement_recover(entity) {
    var now = Date.now();

    if (now - MOVEMENT_STATE.last_recovery < 2500) {
        return false;
    }

    MOVEMENT_STATE.last_recovery = now;

    set_message("Unstucking");

    if (movement_try_nudge()) {
        MOVEMENT_STATE.stuck_ticks = 0;
        MOVEMENT_STATE.is_stuck = false;
        return true;
    }

    if (entity) {
        movement_smart_move({
            map: entity.map || character.map,
            x: entity.x,
            y: entity.y
        });
    } else {
        movement_smart_move(CONFIG.monster);
    }

    MOVEMENT_STATE.stuck_ticks = 0;
    MOVEMENT_STATE.is_stuck = false;

    return true;
}

function movement_try_nudge() {
    var nudges = [
        { x: 40, y: 0 },
        { x: -40, y: 0 },
        { x: 0, y: 40 },
        { x: 0, y: -40 },
        { x: 30, y: 30 },
        { x: -30, y: 30 },
        { x: 30, y: -30 },
        { x: -30, y: -30 }
    ];

    for (var i = 0; i < nudges.length; i++) {
        var target_x = character.x + nudges[i].x;
        var target_y = character.y + nudges[i].y;

        if (typeof can_move_to === "function") {
            if (!can_move_to(target_x, target_y)) {
                continue;
            }
        }

        move(target_x, target_y);
        return true;
    }

    return false;
}


// =====================================================
// LEADER HELPERS
// =====================================================

function movement_get_leader() {
    if (party_is_leader()) {
        return character;
    }

    return get_player(PARTY.leader);
}


// =====================================================
// DISTANCE HELPERS
// Define our own so the module is predictable.
// =====================================================

function movement_distance(a, b) {
    if (!a || !b) {
        return 999999;
    }

    return movement_distance_points(a.x, a.y, b.x, b.y);
}

function movement_distance_points(x1, y1, x2, y2) {
    var dx = x1 - x2;
    var dy = y1 - y2;

    return Math.sqrt(dx * dx + dy * dy);
}