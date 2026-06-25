// =====================================================
// INVENTORY HELPERS
// =====================================================

function item_quantity(item_name) {
    var amount = 0;

    for (var i = 0; i < character.items.length; i++) {
        var item = character.items[i];

        if (item && item.name === item_name) {
            amount += item.q || 1;
        }
    }

    return amount;
}

function free_slots() {
    var count = 0;

    for (var i = 0; i < character.items.length; i++) {
        if (!character.items[i]) {
            count++;
        }
    }

    return count;
}
