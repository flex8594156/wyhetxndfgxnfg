const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
		client.user.setStatus("dnd");
        client.user.setActivity(`نظام المقاطعة (مقاطعة الاسكا)`)
    },
};