const { Client, GatewayIntentBits, Partials, Events, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionType } = require('discord.js');
const { readdirSync } = require('node:fs');
const mysql = require('mysql');
const { TOKEN } = require('./JSON/config.json');
const { host, username, password, database } = require('./JSON/php.json');

const connection = mysql.createConnection({
    host: host,
    user: username,
    password: password,
    database: database,
});

const client = new Client({
    intents: [
        ...Object.values(GatewayIntentBits)
    ],
    partials: [
        ...Object.values(Partials)
    ]
});

readdirSync('./handlers').forEach(handler => {
    require(`./handlers/${handler}`)(client);
});

connection.connect((err) => {
    if (err) {
        console.error('Can not connect to database', err);
        return;
    }
    console.log('Connected to database');
});



let previousSerials = {};
const checkSerialChanges = async () => {
    const query = 'SELECT id, serial, DiscordID FROM users';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return;
        }
        results.forEach(async (row) => {
            const accountId = row.id;
            const currentSerial = row.mtaserial;
            const discordId = row.DiscordID;
            if (previousSerials[accountId] && previousSerials[accountId] !== currentSerial) {
                const user = await client.users.fetch(discordId);
                if (user) {
                    const embed = new EmbedBuilder()
                        .setTitle('تنبيه امني !')
                        .setDescription(`I think that someone is trying to steal your account because your account was registered from a computer other than yours
                        \nSerial: **${currentSerial}**\nIf it was not you who registered from this account, inform the administration in Ticket immediately
                        \n---------------\nاعتقد ان هناك من يحاول سرقة حسابك لانه تم التسجيل لحسابك من كمبيوتر غير الخاص بك\nSerial: **${currentSerial}**\nلو لم يكن انت من قمت بالتسجيل من هذا السريال قم بأبلاغ الادارة في تذكرة فورا.`)
                        .setTimestamp();
                        user.send({ embeds: [embed] })
                        .then(() => console.log(`Notification sent to ${discordId}`))
                        .catch(err => console.error('Failed to send message:', err));
                        }
                        }
                    previousSerials[accountId] = currentSerial;
        });
    });
};
setInterval(checkSerialChanges, 1000); 


const roleFactionData = {
    // Police Department
    '1295417455224557701': { rank: 1, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1295417454171918366': { rank: 2, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1295417453307756685': { rank: 3, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1295417451244294196': { rank: 4, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1299367425191575705': { rank: 5, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1295417449054732368': { rank: 6, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1295417448123601006': { rank: 7, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1295417447116963921': { rank: 8, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1295417446123175946': { rank: 9, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1295417444789129357': { rank: 10, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1295417443849601055': { rank: 11, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1295417443077853224': { rank: 12, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1295417441308119112': { rank: 13, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1295417439131275337': { rank: 14, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1295417437574926386': { rank: 15, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1295417435490357388': { rank: 16, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1323351197197008926': { rank: 17, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1323351204679647323': { rank: 18, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1323351207028330497': { rank: 19, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1323352007347671060': { rank: 20, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1323351202456535080': { rank: 21, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1323351200334352394': { rank: 22, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1295417426825187470': { rank: 23, jobType: 'PoliceJob', jobName: 'شرطي' },
    '1295417425495330830': { rank: 24, jobType: 'PoliceJob', jobName: 'شرطي' },
    // EMS Department
    '1295417479144669317': { rank: 1, jobType: 'EMSJob', jobName: 'اسعاف' },
    '1295417478092034129': { rank: 2, jobType: 'EMSJob', jobName: 'اسعاف' },
    '1295417476758241362': { rank: 3, jobType: 'EMSJob', jobName: 'اسعاف' },
    '1295417476091478108': { rank: 4, jobType: 'EMSJob', jobName: 'اسعاف' },
    '1295417475034517514': { rank: 5, jobType: 'EMSJob', jobName: 'اسعاف' },
    '1295417473671106562': { rank: 6, jobType: 'EMSJob', jobName: 'اسعاف' },
    '1295417472559874159': { rank: 7, jobType: 'EMSJob', jobName: 'اسعاف' },
    '1295417471481806868': { rank: 8, jobType: 'EMSJob', jobName: 'اسعاف' },
    '1295417469988765739': { rank: 9, jobType: 'EMSJob', jobName: 'اسعاف' },
    '1295417469179007078': { rank: 10, jobType: 'EMSJob', jobName: 'اسعاف' },
    '1295417468335947937': { rank: 11, jobType: 'EMSJob', jobName: 'اسعاف' },
    '1295417460018774070': { rank: 12, jobType: 'EMSJob', jobName: 'اسعاف' },
    '1295417459280711823': { rank: 13, jobType: 'EMSJob', jobName: 'اسعاف' },
    // Mechanic Department
    '1295417501550907424': { rank: 1, jobType: 'MechanicJob', jobName: 'ميكانيكي' },
    '1295417501550907424': { rank: 2, jobType: 'MechanicJob', jobName: 'ميكانيكي' },
    '1295417500007403553': { rank: 3, jobType: 'MechanicJob', jobName: 'ميكانيكي' },
    '1295417499180990565': { rank: 4, jobType: 'MechanicJob', jobName: 'ميكانيكي' },
    '1295417497830297610': { rank: 5, jobType: 'MechanicJob', jobName: 'ميكانيكي' },
    '1295417496353898510': { rank: 6, jobType: 'MechanicJob', jobName: 'ميكانيكي' },
    '1295417495565631602': { rank: 7, jobType: 'MechanicJob', jobName: 'ميكانيكي' },
    '1295417494479179928': { rank: 8, jobType: 'MechanicJob', jobName: 'ميكانيكي' },
    '1295417493103444073': { rank: 9, jobType: 'MechanicJob', jobName: 'ميكانيكي' },
    '1295417492235354113': { rank: 10, jobType: 'MechanicJob', jobName: 'ميكانيكي' },
    '1333036396646240266': { rank: 11, jobType: 'MechanicJob', jobName: 'ميكانيكي' },
    '1295417484916035594': { rank: 12, jobType: 'MechanicJob', jobName: 'ميكانيكي' },
    '1295417484010324110': { rank: 13, jobType: 'MechanicJob', jobName: 'ميكانيكي' },
    // Harbour Department
    '1295417533507305564': { rank: 1, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1295417531955282005': { rank: 2, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1295417530592133150': { rank: 3, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1295417528415162379': { rank: 4, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1295417526964191293': { rank: 1, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1295417526213410826': { rank: 2, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1295417525206782015': { rank: 3, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1295417524174979073': { rank: 4, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1295417523109367869': { rank: 1, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1295417522400526408': { rank: 2, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1295417520295120977': { rank: 3, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1295417519506722938': { rank: 4, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1295417518533382235': { rank: 1, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1295417517497520189': { rank: 1, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1295417516256002140': { rank: 1, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1295417515538907198': { rank: 1, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1323351751054590068': { rank: 2, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1323352116391055431': { rank: 3, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1323351760240377907': { rank: 4, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1323351762895245384': { rank: 1, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1323351754162573322': { rank: 2, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1323351757128077412': { rank: 3, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1295417507162624080': { rank: 4, jobType: 'HarbourJob', jobName: 'ميناء' },
    '1295417506143404093': { rank: 5, jobType: 'HarbourJob', jobName: 'ميناء' }
};

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    const newRole = newMember.roles.cache.find(role => roleFactionData[role.id]);
    if (newRole && !oldMember.roles.cache.has(newRole.id)) {
        const discordId = newMember.id;
        const sqlAccount = 'SELECT id FROM users WHERE DiscordID = ?';
        connection.query(sqlAccount, [discordId], (error, results) => {
            if (error) {
                console.error('Error fetching account information:', error);
                return;
            }
            if (results.length > 0) {
                const accountId = results[0].id;
                const jobData = roleFactionData[newRole.id];
                const jobType = jobData.jobType;
                const jobRank = jobData.rank;
                const sqlUpdate = `
                    UPDATE characters 
                    SET ${jobType} = ?
                    WHERE user_id = ?
                `;
                connection.query(sqlUpdate, [jobRank, accountId], (updateError) => {
                    if (updateError) {
                        console.error('Error updating database:', updateError);
                        return;
                    }
                    console.log(`Updated ${jobType} for account ID ${accountId} to rank ${jobRank}`);
                });
            } else {
                console.log(`No account found for Discord ID: ${discordId}`);
            }
        });
    }
    const removedRole = oldMember.roles.cache.find(role => !newMember.roles.cache.has(role.id) && roleFactionData[role.id]);
    if (removedRole) {
        const discordId = newMember.id;
        const jobType = roleFactionData[removedRole.id].jobType;
        const sqlAccount = 'SELECT id FROM users WHERE DiscordID = ?';
        connection.query(sqlAccount, [discordId], (error, results) => {
            if (error) {
                console.error('Error fetching account information:', error);
                return;
            }
            if (results.length > 0) {
                const accountId = results[0].id;
                const sqlUpdate = `
                    UPDATE characters 
                    SET ${jobType} = -1
                    WHERE user_id = ?
                `;
                connection.query(sqlUpdate, [accountId], (updateError) => {
                    if (updateError) {
                        console.error('Error updating database:', updateError);
                        return;
                    }
                    console.log(`Reset ${jobType} for account ID ${accountId} to -1`);
                });
            } else {
                console.log(`No account found for Discord ID: ${discordId}`);
            }
        });
    }
});




const roleDetails = {
    '1295417392284831815': { name: 'Trial Admin', dbId: 1 },
    '1295417391169278032': { name: 'Admin', dbId: 2 },
    '1295417390171029545': { name: 'Senior Admin', dbId: 3 },
    '1295417387981606943': { name: 'Lead Admin', dbId: 4 },
    '1295417386366931016': { name: 'Supervisor', dbId: 5 },
    '1295417385171550248': { name: 'Head Admin', dbId: 6 },
    '1295417383661473883': { name: 'Vicefounder', dbId: 7 },
    '1295417363365232651': { name: 'Community Developer', dbId: 8 },
    '1295417383107956816': { name: 'Server Control', dbId: 8 },
    '1295417382164103262': { name: 'Community Manager', dbId: 9 },
    '1295417357757448192': { name: 'Commumity Owner', dbId: 10 }
};


client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    const newRole = newMember.roles.cache.find(role => roleDetails[role.id]);

    if (newRole && !oldMember.roles.cache.has(newRole.id)) {
        const discordId = newMember.id;
        const roleDetail = roleDetails[newRole.id];

        const sqlAccount = 'SELECT id FROM users WHERE DiscordID = ?';
        connection.query(sqlAccount, [discordId], (error, results) => {
            if (error) {
                console.error('Error fetching account information:', error);
                return;
            }

            if (results.length > 0) {
                const accountId = results[0].id;
                const adminId = roleDetail.dbId;


                    
                    const sqlUpdateCharacters = 'UPDATE characters SET AdminJob = ? WHERE user_id = ?';
                    connection.query(sqlUpdateCharacters, [adminId, accountId], (charError) => {
                        if (charError) {
                            console.error('Error updating characters database:', charError);
                            return;
                        }
                        console.log(`Updated AdminJob for user_id ${accountId} to ${adminId}`);
                    });

                    newMember.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(`Promotion You ${newMember.user.username}`)
                                .setDescription(`**You Have Been Promoted To **${roleDetail.name}**  Congratulations!.**\n**Reason: بسبب امتيازك**`)
                        ]
                    }).catch(err => console.error('Error sending DM:', err));
            } else {
                console.log(`No account found for Discord ID: ${discordId}`);
            }
        });
    }

    const removedRole = oldMember.roles.cache.find(role => !newMember.roles.cache.has(role.id) && roleDetails[role.id]);

    if (removedRole) {
        const discordId = newMember.id;

        const sqlAccount = 'SELECT id FROM users WHERE DiscordID = ?';
        connection.query(sqlAccount, [discordId], (error, results) => {
            if (error) {
                console.error('Error fetching account information:', error);
                return;
            }

            if (results.length > 0) {
                const accountId = results[0].id;

                    const sqlUpdateCharacters = 'UPDATE characters SET AdminJob = ? WHERE user_id = ?';
                    connection.query(sqlUpdateCharacters, [-1, accountId], (charError) => {
                        if (charError) {
                            console.error('Error updating characters database:', charError);
                            return;
                        }
                        console.log(`Reset AdminJob for user_id ${accountId} to -1`);
                    });
            } else {
                console.log(`No account found for Discord ID: ${discordId}`);
            }
        });
    }
});

client.on('messageCreate', async message => {

    if (message.author.bot) return;

    if (message.channel.isDMBased()) {
        console.log(`Received DM from ${message.author.tag}: ${message.content}`);

        const code = message.content.trim();
        if (code.length === 8 && /^[A-Za-z0-9]+$/.test(code)) { 

            const query = 'SELECT * FROM users WHERE activationCode = ?';
            connection.query(query, [code], (error, results) => {
                if (error) {
                    console.error('Error querying database:', error);
                    message.reply('There was an error processing your request.');
                    return;
                }

                if (results.length > 0) {
                    const accountData = results[0];
                    

                    const username = accountData.username || 'Unknown';
                    const id = accountData.id ? accountData.id.toString() : 'Unknown';

                    const updateQuery = 'UPDATE users SET discordID = ?, activationCode = NULL WHERE activationCode = ?';
                    connection.query(updateQuery, [message.author.id, code], (updateError) => {
                        if (updateError) {
                            console.error('Error updating Discord ID:', updateError);
                            message.reply('There was an error updating your Discord ID.');
                            return;
                        }


                        const embed = new EmbedBuilder()
                            .setTitle('Account Linked Successfully')
                            .addFields(
                                { name: 'Username', value: username, inline: true },
                                { name: 'Account ID', value: id, inline: true },
                                { name: 'Discord Username', value: message.author.tag, inline: true }
                            )
                            .setColor('#00FF00');
                        message.reply({ embeds: [embed] });
                    });
                } else {
                    message.reply('Invalid verification code.');
                }
            });
        } else {
            message.reply('Invalid code format. Please make sure your code is 8 characters long.');
        }
    }
});

// تعريف معرفات الرتب
const CIVILIAN_FAMILY_ROLE_ID = '1357309220193833144'; // ضع هنا معرف رتبة العائلات المدنية
const GANG_FAMILY_ROLE_ID = '1357309268252168382';     // ضع هنا معرف رتبة العصابات

// دالة للتحقق من العائلات وتحديث الرتب
const checkFamilyRoles = async () => {
    try {
        // التحقق من جدول العائلات
        connection.query('SELECT id, type FROM families', async (error, families) => {
            if (error) {
                console.error('Error checking families:', error);
                return;
            }
            for (const family of families) {
                const roleId = family.type.toLowerCase() === 'civilian' ? CIVILIAN_FAMILY_ROLE_ID : GANG_FAMILY_ROLE_ID;
                const otherRoleId = family.type.toLowerCase() === 'civilian' ? GANG_FAMILY_ROLE_ID : CIVILIAN_FAMILY_ROLE_ID;
                connection.query('SELECT account_name FROM family_members WHERE family_id = ?', [family.id], async (memberError, members) => {
                    if (memberError) {
                        console.error('Error checking family members:', memberError);
                        return;
                    }
                    for (const member of members) {
                        connection.query('SELECT user_id FROM characters WHERE name = ?', [member.account_name], async (charError, chars) => {
                            if (charError || !chars.length) {
                                console.error('Error or no character found:', charError);
                                return;
                            }
                            const userId = chars[0].user_id;
                            connection.query('SELECT DiscordID FROM users WHERE id = ?', [userId], async (userError, users) => {
                                if (userError || !users.length || !users[0].DiscordID) {
                                    return;
                                }
                                const discordId = users[0].DiscordID;
                                client.guilds.cache.forEach(async (guild) => {
                                    try {
                                        const member = await guild.members.fetch(discordId).catch(() => null);
                                        if (!member) return;
                                        const hasCorrectRole = member.roles.cache.has(roleId);
                                        const hasOtherRole = member.roles.cache.has(otherRoleId);
                                        if (hasOtherRole) {
                                            const otherRole = guild.roles.cache.get(otherRoleId);
                                            if (otherRole) {
                                                await member.roles.remove(otherRole).catch(console.error);
                                                console.log(`Removed ${family.type === 'civilian' ? 'gang' : 'civilian'} role from ${member.user.tag}`);
                                            }
                                        }
                                        if (!hasCorrectRole) {
                                            const role = guild.roles.cache.get(roleId);
                                            if (role) {
                                                await member.roles.add(role).catch(console.error);
                                                console.log(`Added ${family.type} role to ${member.user.tag}`);
                                            }
                                        }
                                    } catch (error) {
                                        console.error(`Error updating roles for user ${discordId}:`, error);
                                    }
                                });
                            });
                        });
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error in checkFamilyRoles:', error);
    }
};
setInterval(checkFamilyRoles, 5000);

client.login(TOKEN);