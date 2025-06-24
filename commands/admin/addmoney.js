const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, Guild } = require('discord.js');
const { host, username, password, database } = require('../../JSON/php.json');
const mysql = require('mysql');

const LOG_CHANNEL_ID = '1356276382979592273'; 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('givemoney')
        .setDescription('اعطاء الاموال')
        .addStringOption(option =>
            option.setName('player')
                .setDescription('اكتب ايدي لاعب')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('الكمية المراد سحبها')
                .setRequired(true)),
    async execute(interaction) {
       
        const requiredPermissions = [PermissionsBitField.Flags.Administrator];
        const member = interaction.member;

        if (!member.permissions.has(requiredPermissions)) {
            return interaction.reply({ content: `Sorry, you do not have permission to use this command.`, ephemeral: true });
        }

        const playerName = interaction.options.getString('player');
        const amountToAdd = interaction.options.getInteger('amount');

        const connection = mysql.createConnection({
            host: host,
            user: username,
            password: password,
            database: database
        });

        connection.connect();

        try {
           
            connection.query('SELECT * FROM characters WHERE user_id = ?', [playerName], function (error, results, fields) {
                if (error) throw error;

                if (results.length > 0) {
                    
                    const currentMoney = results[0].money;
                    const newMoney = currentMoney + amountToAdd;

                    connection.query('UPDATE characters SET money = ? WHERE user_id = ?', [newMoney, playerName], function (error, results, fields) {
                        if (error) throw error;

                        const doneEmbed = new EmbedBuilder()
                            .setDescription(`Successfully added ${amountToAdd} money to player character **${playerName}**. New balance: ${newMoney}`)

                        
                        const logEmbed = new EmbedBuilder()
                            .setTitle('Money Addition Log')
                            .setDescription(`Money has been added to a player character.`)
                            .addFields(
                                { name: 'Player Character', value: playerName },
                                { name: 'Amount Added', value: `${amountToAdd}` },
                                { name: 'New Balance', value: `${newMoney}` },
                                { name: 'Added by', value: interaction.user.tag }
                            )
                            .setTimestamp();

                        const guild = interaction.guild;
                        const channel = guild.channels.cache.get(LOG_CHANNEL_ID);

                        if (channel && channel.isTextBased()) {
                            channel.send({ embeds: [logEmbed] })
                                .then(() => console.log('Log message sent successfully.'))
                                .catch(error => console.error('Error sending log message:', error));
                        } else {
                            console.error(`Error: Could not find text channel with ID ${LOG_CHANNEL_ID} in guild ${guild.name}.`);
                        }

                        interaction.reply({ embeds: [doneEmbed] });
                        connection.end();
                    });
                } else {
                    const erp = new EmbedBuilder()
                        .setDescription(`Player character **${playerName}** not found.`)

                    interaction.reply({ embeds: [erp] });
                    connection.end();
                }
            });
        } catch (error) {
            console.error('Error executing SQL query:', error);
            interaction.reply('An error occurred while processing your request.');
            connection.end();
        }
    },
};
