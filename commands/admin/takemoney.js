const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { host, username, password, database } = require('../../JSON/php.json');
const mysql = require('mysql');


const logChannelId = '1356276886979739941'; 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('takemoney')
        .setDescription('سحب الاموال')
        .addStringOption(option =>
            option.setName('player')
                .setDescription('اكتب ايدي اللاعب')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('كمية الاموال المراد سحبها')
                .setRequired(true)),
    async execute(interaction) {
         
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
            !interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: 'Sorry, you do not have permission to use this command.', ephemeral: true });
        }

        const playerName = interaction.options.getString('player');
        const amountToTake = interaction.options.getInteger('amount');

        const connection = mysql.createConnection({
            host: host,
            user: username,
            password: password,
            database: database
        });

        connection.connect();

        try {
            
            connection.query('SELECT * FROM characters WHERE user_id = ?', [playerName], function (error, results, fields) {
                if (error) {
                    logError('Error executing SQL query:', error);
                    throw error;
                }

                if (results.length > 0) {
                    
                    const currentMoney = results[0].money;

                    if (currentMoney >= amountToTake) {
                       
                        const newMoney = currentMoney - amountToTake;

                        connection.query('UPDATE characters SET money = ? WHERE user_id = ?', [newMoney, playerName], function (error, results, fields) {
                            if (error) {
                                logError('Error updating money:', error);
                                throw error;
                            }

                            const doneEmbed = new EmbedBuilder()
                                .setDescription(`Successfully took ${amountToTake} money from player character **${playerName}**. New balance: ${newMoney}`)
                               

                            interaction.reply({ embeds: [doneEmbed] });
                            logActivity(`Successfully took ${amountToTake} money from player character **${playerName}**. New balance: ${newMoney}`);
                            connection.end();
                        });
                    } else {
                        const insufficientEmbed = new EmbedBuilder()
                            .setDescription(`Player character **${playerName}** does not have enough money to take ${amountToTake}. Current balance: ${currentMoney}`)
                           

                        interaction.reply({ embeds: [insufficientEmbed] });
                        logActivity(`Failed to take ${amountToTake} money from player character **${playerName}**. Not enough money.`);
                        connection.end();
                    }
                } else {
                    const notFoundEmbed = new EmbedBuilder()
                        .setDescription(`Player character **${playerName}** not found.`)
                       

                    interaction.reply({ embeds: [notFoundEmbed] });
                    logActivity(`Player character **${playerName}** not found.`);
                    connection.end();
                }
            });
        } catch (error) {
            console.error('Error executing SQL query:', error);
            interaction.reply('An error occurred while processing your request.');
            logError('Error executing SQL query:', error);
            connection.end();
        }

        async function logActivity(message) {
            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('Activity Log')
                    .setDescription(message)
                   
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }
        }

        async function logError(message, error) {
            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('Error Log')
                    .setDescription(`${message}\n\`\`\`js\n${error.stack}\n\`\`\``)
                    
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }
        }
    },
};
