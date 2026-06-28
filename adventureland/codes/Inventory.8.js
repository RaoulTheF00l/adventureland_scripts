// =====================================================
// INVENTORY MODULE
// Handles loot and basic inventory helper functions.
//
// Job:
// - Loot nearby chests.
// - Count items.
// - Count free inventory slots.
// - Later: selling checks, keep lists, upgrade candidates.
// =====================================================


// =====================================================
// LOOTING
// =====================================================

function inventory_loot() {
    if (typeof loot !== "function") {
        return;
    }

    loot();
}


// =====================================================
// ITEM COUNTING
// =====================================================

function inventory_item_quantity(item_name) {
    var amount = 0;

    for (var i = 0; i < character.items.length; i++) {
        var item = character.items[i];

        if (!item) {
            continue;
        }

        if (item.name === item_name) {
            amount += item.q || 1;
        }
    }

    return amount;
}


// =====================================================
// FREE SLOT COUNTING
// =====================================================

function inventory_free_slots() {
    var count = 0;

    for (var i = 0; i < character.items.length; i++) {
        if (!character.items[i]) {
            count++;
        }
    }

    return count;
}


// =====================================================
// LIST HELPER
// Useful later for sell lists / keep lists.
// =====================================================

function inventory_list_has(list, value) {
    if (!list) {
        return false;
    }

    return list.indexOf(value) !== -1;
}