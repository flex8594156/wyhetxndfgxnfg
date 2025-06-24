const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { host, username, password, database } = require('../../JSON/php.json');
const mysql = require('mysql');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('topmoney')
        .setDescription('اكثر 10 اموالا داخل الخادم'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: `Sorry you are not allowed to do this action.`, ephemeral: true });
        }

        const connection = mysql.createConnection({
            host: host,
            user: username,
            password: password,
            database: database
        });

        connection.connect();

        try {
           
            connection.query('SELECT * FROM characters ORDER BY money DESC LIMIT 10', function (error, results, fields) {
                if (error) throw error;

                const embed = new EmbedBuilder()
                    .setTitle('Top 10 Players by Money')
                    .setColor('#3498db'); 

                const fieldsArray = results.map((row, index) => ({
                    name: `${index + 1}. ${row.name}`,
                    value: `Money: ${row.money}`,
                    inline: false
                }));

                embed.addFields(fieldsArray);

               
                interaction.reply({ embeds: [embed] });
                connection.end();
            });
        } catch (error) {
            console.error('Error executing SQL query:', error);
            interaction.reply('An error occurred while processing your request.');
            connection.end();
        }
    },
};
