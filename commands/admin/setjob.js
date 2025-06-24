const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { host, username, password, database } = require('../../JSON/php.json');
const mysql = require('mysql');

const LOG_CHANNEL_ID = '1356276578320908518';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setjob')
        .setDescription('تغيير الوظيفة')
        .addStringOption(option =>
            option.setName('player')
                .setDescription('اكتب ايدي لاعب')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('job_type')
                .setDescription('نوع الوظيفة')
                .setRequired(true)
                .addChoices(
                    { name: 'شرطة', value: 'PoliceJob' },
                    { name: 'اسعاف', value: 'EMSJob' },
                    { name: 'ميكانيكي', value: 'MechanicJob' },
                    { name: 'ميناء', value: 'HarbourJob' }
                ))
        .addIntegerOption(option =>
            option.setName('rank')
                .setDescription('رتبة الوظيفة (1-24)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(24)),
    async execute(interaction) {
        const member = interaction.member;
        const requiredPermissions = [PermissionsBitField.Flags.Administrator];
        
        if (!member.permissions.has(requiredPermissions)) {
            return interaction.reply({ content: `Sorry, you do not have permission to use this command.`, ephemeral: true });
        }

        const playerName = interaction.options.getString('player');
        const jobType = interaction.options.getString('job_type');
        const rank = interaction.options.getInteger('rank');

        const connection = mysql.createConnection({
            host: host,
            user: username,
            password: password,
            database: database
        });

        connection.connect();

        try {
            // التحقق من وجود اللاعب
            connection.query('SELECT * FROM characters WHERE user_id = ?', [playerName], function (error, results) {
                if (error) throw error;

                if (results.length > 0) {
                    // تحديث الوظيفة
                    const updateQuery = `UPDATE characters SET ${jobType} = ? WHERE user_id = ?`;
                    connection.query(updateQuery, [rank, playerName], function (error, results) {
                        if (error) {
                            console.error('Error updating job:', error);
                            interaction.reply({ content: 'حدث خطأ أثناء تحديث الوظيفة', ephemeral: true });
                            return;
                        }

                        // رسالة نجاح
                        const done = new EmbedBuilder()
                            .setDescription(`تم تعيين ${playerName} في وظيفة ${getJobName(jobType)} برتبة ${rank}`)
                            .setColor('Green');
                        
                        interaction.reply({ embeds: [done] });

                        // سجل العملية
                        const logEmbed = new EmbedBuilder()
                            .setTitle('تعيين وظيفة')
                            .addFields(
                                { name: 'اللاعب', value: playerName },
                                { name: 'الوظيفة', value: getJobName(jobType) },
                                { name: 'الرتبة', value: `${rank}` },
                                { name: 'بواسطة', value: interaction.user.tag }
                            )
                            .setTimestamp();

                        const guild = interaction.guild;
                        const channel = guild.channels.cache.get(LOG_CHANNEL_ID);

                        if (channel && channel.isTextBased()) {
                            channel.send({ embeds: [logEmbed] });
                        }
                    });
                } else {
                    interaction.reply({ 
                        content: `لم يتم العثور على اللاعب ${playerName}`, 
                        ephemeral: true 
                    });
                }
                connection.end();
            });
        } catch (error) {
            console.error('Error:', error);
            interaction.reply({ 
                content: 'حدث خطأ أثناء تنفيذ الأمر', 
                ephemeral: true 
            });
            connection.end();
        }
    },
};

function getJobName(jobType) {
    switch(jobType) {
        case 'PoliceJob': return 'شرطة';
        case 'EMSJob': return 'اسعاف';
        case 'MechanicJob': return 'ميكانيكي';
        case 'HarbourJob': return 'ميناء';
        default: return jobType;
    }
}
