const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { host, username, password, database } = require('../../JSON/php.json');
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: host,
    user: username,
    password: password,
    database: database
});

// قائمة بالمزادات النشطة
// تخزين المزادات النشطة في مكان مركزي حتى يمكن الوصول إليها من أي مكان
global.activeAuctions = global.activeAuctions || new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startauction')
        .setDescription('بدء مزاد على متجر')
        .addIntegerOption(option =>
            option.setName('shop_id')
                .setDescription('رقم المتجر')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('starting_price')
                .setDescription('سعر البداية')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('مدة المزاد بالدقائق')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(1440)), // حد أقصى 24 ساعة
    async execute(interaction) {
        // التحقق من صلاحيات المستخدم
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: 'ليس لديك صلاحية لاستخدام هذا الأمر',
                ephemeral: true
            });
        }

        const shopId = interaction.options.getInteger('shop_id');
        const startingPrice = interaction.options.getInteger('starting_price');
        const durationMinutes = interaction.options.getInteger('duration');

        // التحقق من وجود المتجر في قاعدة البيانات
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
            
            // التحقق من أن المتجر ليس قيد المزاد بالفعل
            if (global.activeAuctions.has(shopId)) {
                return interaction.reply({
                    content: `هذا المتجر قيد المزاد بالفعل!`,
                    ephemeral: true
                });
            }

            // إنشاء الإيمبد الخاص بالمزاد
            const endTime = new Date();
            endTime.setMinutes(endTime.getMinutes() + durationMinutes);
            
            const auctionEmbed = new EmbedBuilder()
                .setTitle(`🏪 مزاد على متجر #${shopId}`)
                .setDescription(`**تفاصيل المتجر:**\n${shopInfo.name || 'متجر'}`)
                .addFields(
                    { name: '💰 السعر الابتدائي', value: `$${startingPrice.toLocaleString()}`, inline: true },
                    { name: '⏱️ ينتهي المزاد في', value: `<t:${Math.floor(endTime.getTime() / 1000)}:R>`, inline: true },
                    { name: '🥇 أعلى مزايد', value: 'لا يوجد بعد', inline: true },
                    { name: '💸 المبلغ الحالي', value: `$${startingPrice.toLocaleString()}`, inline: true }
                )
                .setColor('#FFD700')
                .setFooter({ text: `يمكن المشاركة فقط للاعبين بحساب مرتبط` })
                .setTimestamp();

            // إنشاء زر المزايدة وزر سحب الأموال
            const bidButton = new ButtonBuilder()
                .setCustomId(`bid_${shopId}`)
                .setLabel('🔨 مزايدة')
                .setStyle(ButtonStyle.Primary);

            const withdrawButton = new ButtonBuilder()
                .setCustomId(`withdraw_${shopId}`)
                .setLabel('❌ سحب الأموال')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(bidButton, withdrawButton);

            // إرسال الإيمبد
            const auctionMessage = await interaction.reply({
                embeds: [auctionEmbed],
                components: [row],
                fetchReply: true
            });

            // تخزين معلومات المزاد
            const auctionInfo = {
                shopId: shopId,
                messageId: auctionMessage.id,
                channelId: interaction.channelId,
                startingPrice: startingPrice,
                currentBid: startingPrice,
                highestBidder: null,
                highestBidderId: null,
                bids: new Map(), // لتخزين مزايدات كل مستخدم
                endTime: endTime,
                shopInfo: shopInfo
            };

            // إضافة المزاد إلى قائمة المزادات النشطة
            global.activeAuctions.set(shopId, auctionInfo);

            // إعداد مؤقت لإنهاء المزاد
            setTimeout(() => endAuction(interaction.client, shopId), durationMinutes * 60 * 1000);
        });
    },
};

// دالة إنهاء المزاد
async function endAuction(client, shopId) {
    const auction = global.activeAuctions.get(shopId);
    if (!auction) return; // المزاد غير موجود أو تم إنهاؤه بالفعل

    try {
        const channel = client.channels.cache.get(auction.channelId);
        if (!channel) return;

        // تحديث رسالة المزاد
        const endedEmbed = new EmbedBuilder()
            .setTitle(`🏪 انتهى المزاد على متجر #${shopId}`)
            .setColor('#2ECC71');

        if (auction.highestBidder) {
            // هناك فائز في المزاد
            endedEmbed.setDescription(`**انتهى المزاد!**\n\nفاز ${auction.highestBidder} بالمتجر مقابل $${auction.currentBid.toLocaleString()}`);
            
            // تحديث مالك المتجر في قاعدة البيانات
            connection.query('UPDATE shops SET owner_id = ? WHERE id = ?', [auction.highestBidderId, shopId], (error) => {
                if (error) {
                    console.error('Error updating shop owner:', error);
                }
            });
        } else {
            // لم يشارك أحد في المزاد
            endedEmbed.setDescription(`**انتهى المزاد بدون مشاركين!**\n\nلم يتم بيع المتجر.`);
        }

        const message = await channel.messages.fetch(auction.messageId);
        await message.edit({
            embeds: [endedEmbed],
            components: [] // إزالة الأزرار
        });

        // إزالة المزاد من القائمة النشطة
        global.activeAuctions.delete(shopId);
    } catch (error) {
        console.error('Error ending auction:', error);
    }
} 