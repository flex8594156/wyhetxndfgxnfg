const { Events } = require('discord.js');

const ALLOWED_GUILD_ID = '1284400130845446178';

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        // التحقق من أن الأمر تم تنفيذه في السيرفر المسموح به فقط
        if (interaction.guildId !== ALLOWED_GUILD_ID) {
            return interaction.reply({ 
                content: 'عذراً، هذا البوت يعمل فقط في السيرفر المخصص له.',
                ephemeral: true 
            });
        }

        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
            return interaction.reply({ 
                content: `لم يتم العثور على الأمر ${interaction.commandName}`, 
                ephemeral: true 
            });
        }

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: 'حدث خطأ أثناء تنفيذ الأمر', 
                    ephemeral: true 
                });
            }
        }
    },
};