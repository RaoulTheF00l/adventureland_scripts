// =====================================================
// DEATH HANDLING
// =====================================================

function handle_death() {
    if (respawning) {
        return;
    }

    respawning = true;
    set_message("Respawning soon");

    setTimeout(function () {
        respawn();
        respawning = false;
    }, 15000);
}