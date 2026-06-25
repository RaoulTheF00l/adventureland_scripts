// =====================================================
// AUTO-UPGRADING
// =====================================================

async function upgrade_one_item() {
    if (character.gold < CONFIG.upgrade_gold_floor) return;

    let item_slot = find_upgrade_item_slot();
    if (item_slot === -1) return;

    await smart_move("scrolls");

    let scroll_slot = locate_item(CONFIG.upgrade_scroll);

    if (scroll_slot === -1) {
        set_message("Buying Scroll");
        buy(CONFIG.upgrade_scroll, 1);
        await delay(800);
        scroll_slot = locate_item(CONFIG.upgrade_scroll);
    }

    if (scroll_slot === -1) {
        game_log("Could not find upgrade scroll.", "orange");
        return;
    }

    await smart_move("upgrade");

    const item = character.items[item_slot];

    if (!item) return;
    if (!CONFIG.upgrade_items.includes(item.name)) return;
    if ((item.level || 0) >= CONFIG.upgrade_max_level) return;

    set_message("Upgrading " + item.name);
    game_log("Upgrading " + item.name + " +" + (item.level || 0));

    upgrade(item_slot, scroll_slot);

    await delay(1200);
}

function find_upgrade_item_slot() {
    for (let i = 0; i < character.items.length; i++) {
        const item = character.items[i];
        if (!item) continue;

        const level = item.level || 0;

        if (
            CONFIG.upgrade_items.includes(item.name)
            && level < CONFIG.upgrade_max_level
        ) {
            return i;
        }
    }

    return -1;
}