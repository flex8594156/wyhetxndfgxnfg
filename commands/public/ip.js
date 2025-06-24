const { SlashCommandBuilder, ChatInputCommandInteraction, Client, Permissions, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ip')
        .setDescription('لرؤية الايبي الخاص بالخادم'),

    /**
     * @param {ChatInputCommandInteraction} interaction 
     * @param {Client} client 
     */
    async execute(interaction, client) {
      
       

       
        const embed = new EmbedBuilder()
            .setDescription(`88.214.58.38:22013`)
            .setColor('#3498db');   

       
        await interaction.reply({ embeds: [embed] });
    },
};
