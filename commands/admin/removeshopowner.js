const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { host, username, password, database } = require('../../JSON/php.json');
const mysql = require('mysql');

const LOG_CHANNEL_ID = '1356276578320908518'; // قم بتغيير هذا المعرف إلى معرف قناة السجلات الخاصة بك

const connection = mysql.createConnection({
    host: host,
    user: username,
    password: password,
    database: database
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removeshopowner')
        .setDescription('سحب ملكية متجر')
        .addIntegerOption(option =>
            option.setName('shop_id')
                .setDescription('رقم المتجر')
                .setRequired(true)),
    async execute(interaction) {
        // التحقق من صلاحيات المستخدم (الإداريين فقط)
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: 'ليس لديك صلاحية لاستخدام هذا الأمر',
                ephemeral: true
            });
        }

        const shopId = interaction.options.getInteger('shop_id');

        // التحقق من وجود المتجر
        connection.query('SELECT * FROM shops WHERE id = ?', [shopId], async (error, results) => {
            if (error) {
                console.error('Database error:', error);
                return interaction.reply({
                    content: 'حدث خطأ أثناء البحث عن المتجر',
                    ephemeral: true
                });
            }

            if (results.length === 0) {
                return interaction.reply({
                    content: `لا يوجد متجر برقم ${shopId}`,
                    ephemeral: true
                });
            }

            const shopInfo = results[0];
            const currentOwner = shopInfo.owner_id;
            const shopName = shopInfo.name || `متجر #${shopId}`;

            // التحقق مما إذا كان المتجر مملوكًا بالفعل
            if (currentOwner === -1 || currentOwner === null || currentOwner === 0) {
                return interaction.reply({
                    content: `هذا المتجر غير مملوك لأي شخص حاليًا.`,
                    ephemeral: true
                });
            }

            // الحصول على اسم المالك الحالي (إذا كان متاحًا)
            connection.query('SELECT username FROM users WHERE id = ?', [currentOwner], async (ownerError, ownerResults) => {
                let ownerName = `Player #${currentOwner}`;
                
                if (!ownerError && ownerResults.length > 0) {
                    ownerName = ownerResults[0].username;
                }

                // تحديث المتجر في قاعدة البيانات
                connection.query('UPDATE shops SET owner_id = -1 WHERE id = ?', [shopId], async (updateError) => {
                    if (updateError) {
                        console.error('Error updating shop owner:', updateError);
                        return interaction.reply({
                            content: 'حدث خطأ أثناء تحديث ملكية المتجر',
                            ephemeral: true
                        });
                    }

                    // إنشاء إيمبد للرد
                    const successEmbed = new EmbedBuilder()
                        .setTitle('✅ تم سحب ملكية المتجر')
                        .setDescription(`تم سحب ملكية ${shopName} من ${ownerName} بنجاح.`)
                        .setColor('#00FF00')
                        .setTimestamp();

                    // الرد على التفاعل
                    await interaction.reply({ embeds: [successEmbed] });

                    // إنشاء إيمبد للسجلات
                    const logEmbed = new EmbedBuilder()
                        .setTitle('🏪 سحب ملكية متجر')
                        .addFields(
                            { name: 'رقم المتجر', value: `${shopId}`, inline: true },
                            { name: 'اسم المتجر', value: shopName, inline: true },
                            { name: 'المالك السابق', value: ownerName, inline: true },
                            { name: 'بواسطة', value: interaction.user.tag, inline: true }
                        )
                        .setColor('#FF5555')
                        .setTimestamp();

                    // إرسال السجل إلى قناة السجلات
                    const guild = interaction.guild;
                    const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);

                    if (logChannel && logChannel.isTextBased()) {
                        logChannel.send({ embeds: [logEmbed] });
                    }
                });
            });
        });
    },
}; 