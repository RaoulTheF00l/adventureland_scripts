// =====================================================
// TOWN RUN
// =====================================================

async function town_run() {
    doing_town_run = true;

    try {
        set_message("Town Run");

        await smart_move("potions");

        await sell_loot();
        await buy_potions();

        if (CONFIG.auto_upgrade) {
            await upgrade_one_item();
        }

        set_message("Back to Goo");
        await smart_move(CONFIG.monster);

    } catch (error) {
        game_log("Town run error: " + error, "red");
    }

    doing_town_run = false;
}

function needs_town_run() {
    if (free_slots() <= CONFIG.free_slots_before_town) return true;

    if (item_quantity(CONFIG.hp_potion) < 10) return true;
    if (item_quantity(CONFIG.mp_potion) < 10) return true;

    if (CONFIG.auto_upgrade && find_upgrade_item_slot() !== -1) return true;

    return false;
}


// =====================================================
// SELLING
// =====================================================

async function sell_loot() {
    for (let i = 0; i < character.items.length; i++) {
        const item = character.items[i];
        if (!item) continue;

        if (should_sell(item)) {
            set_message("Selling " + item.name);
            sell(i, item.q || 1);
            await delay(250);
        }
    }
}

function should_sell(item) {
    if (CONFIG.keep_items.includes(item.name)) return false;
    if (CONFIG.upgrade_items.includes(item.name)) return false;

    if (CONFIG.sell_list.includes(item.name)) return true;

    return CONFIG.sell_unknown_items;
}


// =====================================================
// BUYING POTIONS
// =====================================================

async function buy_potions() {
    restock(CONFIG.hp_potion, CONFIG.desired_hp_potions);
    await delay(500);

    restock(CONFIG.mp_potion, CONFIG.desired_mp_potions);
    await delay(500);
}

function restock(item_name, desired_amount) {
    const have = item_quantity(item_name);
    const need = desired_amount - have;

    if (need > 0) {
        set_message("Buying " + item_name);
        buy(item_name, need);
    }
}

