const { Events, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
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
        // التعامل فقط مع تفاعلات الأزرار
        if (!interaction.isButton()) return;

        // التحقق من أن زر التفاعل متعلق بالمزاد
        if (interaction.customId.startsWith('bid_')) {
            const shopId = parseInt(interaction.customId.split('_')[1]);
            
            // التحقق من وجود المزاد
            const auction = global.activeAuctions.get(shopId);
            if (!auction) {
                return interaction.reply({
                    content: 'هذا المزاد لم يعد نشطاً.',
                    ephemeral: true
                });
            }

            // التحقق من ربط حساب المستخدم
            connection.query('SELECT * FROM users WHERE DiscordID = ?', [interaction.user.id], async (error, results) => {
                if (error) {
                    console.error('Database error:', error);
                    return interaction.reply({
                        content: 'حدث خطأ أثناء التحقق من حسابك.',
                        ephemeral: true
                    });
                }

                if (results.length === 0) {
                    return interaction.reply({
                        content: 'يجب عليك ربط حسابك في اللعبة أولاً للمشاركة في المزاد.',
                        ephemeral: true
                    });
                }

                const userId = results[0].id;

                // إنشاء مودال لإدخال قيمة المزايدة
                const modal = new ModalBuilder()
                    .setCustomId(`bid_modal_${shopId}_${userId}`)
                    .setTitle(`مزايدة على متجر #${shopId}`);

                const bidInput = new TextInputBuilder()
                    .setCustomId('bid_amount')
                    .setLabel(`أدخل مبلغ المزايدة (الحد الأدنى: $${Math.ceil(auction.currentBid * 1.05).toLocaleString()})`)
                    .setPlaceholder('مثال: 100000')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const actionRow = new ActionRowBuilder().addComponents(bidInput);
                modal.addComponents(actionRow);

                await interaction.showModal(modal);
            });
        }

        // إذا كان الزر متعلق بسحب الأموال
        if (interaction.customId.startsWith('withdraw_')) {
            const shopId = parseInt(interaction.customId.split('_')[1]);
            
            // التحقق من وجود المزاد
            const auction = global.activeAuctions.get(shopId);
            if (!auction) {
                return interaction.reply({
                    content: 'هذا المزاد لم يعد نشطاً.',
                    ephemeral: true
                });
            }

            // التحقق من ربط حساب المستخدم
            connection.query('SELECT * FROM users WHERE DiscordID = ?', [interaction.user.id], async (error, results) => {
                if (error) {
                    console.error('Database error:', error);
                    return interaction.reply({
                        content: 'حدث خطأ أثناء التحقق من حسابك.',
                        ephemeral: true
                    });
                }

                if (results.length === 0) {
                    return interaction.reply({
                        content: 'يجب عليك ربط حسابك في اللعبة أولاً للمشاركة في المزاد.',
                        ephemeral: true
                    });
                }

                const userId = results[0].id;

                // التحقق مما إذا كان المستخدم قد شارك في المزاد بالفعل
                if (!auction.bids.has(userId)) {
                    return interaction.reply({
                        content: 'لم تشارك في هذا المزاد بعد.',
                        ephemeral: true
                    });
                }

                const bidAmount = auction.bids.get(userId);

                // إعادة مبلغ المزايدة للمستخدم
                connection.query('UPDATE characters SET money = money + ? WHERE user_id = ?', [bidAmount, userId], async (updateError) => {
                    if (updateError) {
                        console.error('Error updating money:', updateError);
                        return interaction.reply({
                            content: 'حدث خطأ أثناء إعادة الأموال.',
                            ephemeral: true
                        });
                    }

                    // تحديث معلومات المزاد
                    auction.bids.delete(userId);

                    // إذا كان المستخدم هو صاحب أعلى مزايدة
                    if (auction.highestBidderId === userId) {
                        // البحث عن ثاني أعلى مزايدة
                        let newHighestBidder = null;
                        let newHighestBid = auction.startingPrice;
                        let newHighestBidderId = null;

                        for (const [bidderId, bidValue] of auction.bids.entries()) {
                            if (bidValue > newHighestBid) {
                                newHighestBid = bidValue;
                                newHighestBidderId = bidderId;
                            }
                        }

                        // إذا وجدنا مزايدة أخرى، نعين المزايد الجديد
                        if (newHighestBidderId) {
                            connection.query('SELECT username FROM users WHERE id = ? LIMIT 1', [newHighestBidderId], async (nameError, nameResults) => {
                                if (!nameError && nameResults.length > 0) {
                                    newHighestBidder = nameResults[0].username;
                                } else {
                                    newHighestBidder = `Player #${newHighestBidderId}`;
                                }

                                updateAuctionWithNewHighestBidder(newHighestBidder, newHighestBidderId, newHighestBid);
                            });
                        } else {
                            // لم يتبق أي مزايدين آخرين
                            updateAuctionWithNewHighestBidder(null, null, auction.startingPrice);
                        }
                    } else {
                        // ليس أعلى مزايد، نكتفي بإظهار رسالة نجاح
                        await interaction.reply({
                            content: `تم سحب مزايدتك بنجاح! تمت إعادة $${bidAmount.toLocaleString()} إلى رصيدك.`,
                            ephemeral: true
                        });
                    }

                    async function updateAuctionWithNewHighestBidder(bidderName, bidderId, newBid) {
                        auction.currentBid = newBid;
                        auction.highestBidder = bidderName;
                        auction.highestBidderId = bidderId;

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
                                    { name: '🥇 أعلى مزايد', value: bidderName ? bidderName : 'لا يوجد بعد', inline: true },
                                    { name: '💸 المبلغ الحالي', value: `$${newBid.toLocaleString()}`, inline: true }
                                );
                            
                            await message.edit({ embeds: [updatedEmbed] });
                            
                            await interaction.reply({
                                content: `تم سحب مزايدتك بنجاح! تمت إعادة $${bidAmount.toLocaleString()} إلى رصيدك.`,
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