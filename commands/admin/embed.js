const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('إرسال رسالة Embed إلى قناة معينة')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('القناة التي تريد إرسال الرسالة إليها')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('title')
                .setDescription('عنوان الرسالة')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('الوصف الخاص بالرسالة')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('field1')
                .setDescription('اسم الحقل 1')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('field1_value')
                .setDescription('القيمة الخاصة بالحقل 1')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('field2')
                .setDescription('اسم الحقل 2')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('field2_value')
                .setDescription('القيمة الخاصة بالحقل 2')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('field3')
                .setDescription('اسم الحقل 3')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('field3_value')
                .setDescription('القيمة الخاصة بالحقل 3')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('image')
                .setDescription('رابط الصورة')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('thumbnail')
                .setDescription('رابط الصورة المصغرة')
                .setRequired(false)),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const field1 = interaction.options.getString('field1');
        const field1_value = interaction.options.getString('field1_value');
        const field2 = interaction.options.getString('field2');
        const field2_value = interaction.options.getString('field2_value');
        const field3 = interaction.options.getString('field3');
        const field3_value = interaction.options.getString('field3_value');
        const image = interaction.options.getString('image');
        const thumbnail = interaction.options.getString('thumbnail');

        // التحقق من الصلاحيات
        const member = interaction.member;
        const requiredPermissions = [PermissionsBitField.Flags.Administrator];
        if (!member.permissions.has(requiredPermissions)) {
            return interaction.reply({ content: `عذرًا، لا تمتلك الصلاحيات لاستخدام هذا الأمر.`, ephemeral: true });
        }

        const embed = new EmbedBuilder();

        // إضافة العنوان إذا كان موجودًا
        if (title) embed.setTitle(title);

        // إضافة الوصف إذا كان موجودًا
        if (description) embed.setDescription(description);

        // إضافة الحقول إذا كانت موجودة
        if (field1 && field1_value) embed.addFields({ name: field1, value: field1_value });
        if (field2 && field2_value) embed.addFields({ name: field2, value: field2_value });
        if (field3 && field3_value) embed.addFields({ name: field3, value: field3_value });

        // إضافة الصورة إذا كانت موجودة
        if (image) embed.setImage(image);

        // إضافة الصورة المصغرة إذا كانت موجودة
        if (thumbnail) embed.setThumbnail(thumbnail);

        // إرسال الرسالة إلى القناة المحددة
        try {
            await channel.send({ embeds: [embed] });
            interaction.reply({ content: `تم إرسال رسالة Embed بنجاح إلى القناة ${channel.name}.`, ephemeral: true });
        } catch (error) {
            console.error('Error sending embed message:', error);
            interaction.reply({ content: 'حدث خطأ أثناء محاولة إرسال رسالة Embed.', ephemeral: true });
        }
    },
};
