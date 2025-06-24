const { SlashCommandBuilder, ChatInputCommandInteraction, Client, Permissions, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('لرؤية الاوامر المتاحة'),

    /**
     * @param {ChatInputCommandInteraction} interaction 
     * @param {Client} client 
     */
    async execute(interaction, client) {
       

       
        const embed = new EmbedBuilder()
            .setTitle(`قائمة المساعد`)
            .setDescription('العامة')
            .addFields(
                { name: '/ip', value: 'لرؤية ايبي الخادم' },
                { name: '/topmoney', value: 'رؤية الاكثر اموالا داخل السيرفر' },
            )
            .setColor('#3498db'); 

        
        await interaction.reply({ embeds: [embed] });
    },
};
