const { Events, EmbedBuilder } = require('discord.js');
const { host, username, password, database } = require('../../JSON/php.json');
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: host,
    user: username,
    password: password,
    database: database
});

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isModalSubmit()) return;

        // التعامل مع مودال المزايدة
        if (interaction.customId.startsWith('bid_modal_')) {
            // استخراج معرفات المتجر والمستخدم
            const parts = interaction.customId.split('_');
            const shopId = parseInt(parts[2]);
            const userId = parseInt(parts[3]);

            // التحقق من وجود المزاد
            const auction = global.activeAuctions.get(shopId);
            if (!auction) {
                return interaction.reply({
                    content: 'هذا المزاد لم يعد نشطاً.',
                    ephemeral: true
                });
            }

            // الحصول على مبلغ المزايدة المدخل
            const bidAmount = parseInt(interaction.fields.getTextInputValue('bid_amount').replace(/,/g, ''));
            
            // التحقق من صحة المبلغ
            if (isNaN(bidAmount) || bidAmount <= 0) {
                return interaction.reply({
                    content: 'يرجى إدخال مبلغ صحيح للمزايدة.',
                    ephemeral: true
                });
            }

            // التحقق من أن المبلغ أعلى من المزايدة الحالية بنسبة 5% على الأقل
            const minimumBid = Math.ceil(auction.currentBid * 1.05);
            if (bidAmount < minimumBid) {
                return interaction.reply({
                    content: `يجب أن يكون مبلغ المزايدة $${minimumBid.toLocaleString()} على الأقل.`,
                    ephemeral: true
                });
            }

            // التحقق من رصيد اللاعب
            connection.query('SELECT money FROM characters WHERE user_id = ? LIMIT 1', [userId], async (error, results) => {
                if (error) {
                    console.error('Database error:', error);
                    return interaction.reply({
                        content: 'حدث خطأ أثناء التحقق من رصيدك.',
                        ephemeral: true
                    });
                }

                if (results.length === 0) {
                    return interaction.reply({
                        content: 'لم يتم العثور على شخصية مرتبطة بحسابك.',
                        ephemeral: true
                    });
                }

                const userMoney = results[0].money;
                
                // حساب المبلغ الإضافي الذي سيتم خصمه
                let amountToDeduct = bidAmount;
                if (auction.bids.has(userId)) {
                    amountToDeduct = bidAmount - auction.bids.get(userId);
                }

                // التحقق من توفر المال الكافي
                if (userMoney < amountToDeduct) {
                    return interaction.reply({
                        content: `ليس لديك رصيد كافٍ. رصيدك الحالي: $${userMoney.toLocaleString()}`,
                        ephemeral: true
                    });
                }

                // خصم المبلغ من رصيد اللاعب
                connection.query('UPDATE characters SET money = money - ? WHERE user_id = ?', [amountToDeduct, userId], async (updateError) => {
                    if (updateError) {
                        console.error('Error updating money:', updateError);
                        return interaction.reply({
                            content: 'حدث خطأ أثناء تحديث رصيدك.',
                            ephemeral: true
                        });
                    }

                    // تحديث معلومات المزاد
                    if (auction.highestBidder && auction.highestBidderId !== userId) {
                        // إعادة المال للمزايد السابق
                        connection.query('UPDATE characters SET money = money + ? WHERE user_id = ?', [auction.bids.get(auction.highestBidderId), auction.highestBidderId], (refundError) => {
                            if (refundError) {
                                console.error('Error refunding previous bidder:', refundError);
                            }
                        });
                    }

                    // الحصول على معلومات المستخدم من users بدلاً من characters
                    connection.query('SELECT username FROM users WHERE id = ? LIMIT 1', [userId], async (nameError, nameResults) => {
                        if (nameError || nameResults.length === 0) {
                            console.error('Error getting username:', nameError);
                            
                            // استخدام معرف اللاعب في حالة عدم العثور على اسم
                            const bidderName = `Player #${userId}`;
                            processAuction(bidderName);
                            return;
                        }
                        
                        const bidderName = nameResults[0].username;
                        processAuction(bidderName);
                    });
                    
                    // وظيفة مساعدة لمعالجة المزاد بعد الحصول على اسم اللاعب
                    async function processAuction(bidderName) {
                        // تحديث معلومات المزاد
                        auction.currentBid = bidAmount;
                        auction.highestBidder = bidderName;
                        auction.highestBidderId = userId;
                        auction.bids.set(userId, bidAmount);

                        // تحديث رسالة المزاد
                        const channel = client.channels.cache.get(auction.channelId);
                        if (!channel) return;

                        try {
                            const message = await channel.messages.fetch(auction.messageId);
                            const currentEmbed = message.embeds[0];
                            
                            const updatedEmbed = new EmbedBuilder(currentEmbed.data)
                                .setFields(
                                    { name: '💰 السعر الابتدائي', value: `$${auction.startingPrice.toLocaleString()}`, inline: true },
                                    { name: '⏱️ ينتهي المزاد في', value: `<t:${Math.floor(auction.endTime.getTime() / 1000)}:R>`, inline: true },
                                    { name: '🥇 أعلى مزايد', value: auction.highestBidder, inline: true },
                                    { name: '💸 المبلغ الحالي', value: `$${bidAmount.toLocaleString()}`, inline: true }
                                );
                            
                            await message.edit({ embeds: [updatedEmbed] });
                            
                            await interaction.reply({
                                content: `تمت المزايدة بنجاح! المبلغ المخصوم: $${amountToDeduct.toLocaleString()}`,
                                ephemeral: true
                            });
                        } catch (editError) {
                            console.error('Error updating auction message:', editError);
                        }
                    }
                });
            });
        }
    }
}; 