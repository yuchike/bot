require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const express = require('express');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    partials: [Partials.Message, Partials.Channel] 
});

// チャンネルID
const SCHEDULE_CHANNEL = process.env.SCHEDULE_CHANNEL;
const INFO_CHANNEL = process.env.INFO_CHANNEL;

// HTTPサーバー（Ping対策）
const app = express();
app.get('/', (req, res) => res.send('Bot is alive'));
app.listen(process.env.PORT || 3000, () => {
    console.log('HTTP server started');
});

// コマンド用コレクション
client.commands = new Collection();

// シフトデータ読み込み
let shifts = [];
const SHIFTS_FILE = './shifts.json';
if (fs.existsSync(SHIFTS_FILE)) {
    shifts = JSON.parse(fs.readFileSync(SHIFTS_FILE));
}

// Bot起動完了
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// コマンド処理
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'shift') {
        const sub = options.getSubcommand();

        if (sub === 'create') {
            const host = options.getUser('host');
            const operation = options.getString('operation');
            const note = options.getString('note') || "-";

            const id = Date.now().toString(); // 仮ID

            const content = 
`【 高山鐵道鐵道運行情報 / Takayama Railway 】\n
Host: ${host}
Operation: ${operation}
Note: ${note}`;

            const scheduleMsg = await client.channels.cache.get(SCHEDULE_CHANNEL).send(content);
            const infoMsg = await client.channels.cache.get(INFO_CHANNEL).send(content);

            const shiftObj = {
                id,
                host: host.id,
                operation,
                note,
                scheduleMessageId: scheduleMsg.id,
                infoMessageId: infoMsg.id
            };

            shifts.push(shiftObj);
            fs.writeFileSync(SHIFTS_FILE, JSON.stringify(shifts, null, 2));

            await interaction.reply({ content: `シフト作成完了（ID: ${id}）`, ephemeral: true });
        }

        if (sub === 'edit') {
            const id = options.getString('id');
            const shift = shifts.find(s => s.id === id);
            if (!shift) return interaction.reply({ content: '指定IDのシフトが見つかりません', ephemeral: true });

            const newHost = options.getUser('host') ? options.getUser('host').id : shift.host;
            const newOperation = options.getString('operation') || shift.operation;
            const newNote = options.getString('note') || shift.note;

            shift.host = newHost;
            shift.operation = newOperation;
            shift.note = newNote;

            fs.writeFileSync(SHIFTS_FILE, JSON.stringify(shifts, null, 2));

            const scheduleChannel = client.channels.cache.get(SCHEDULE_CHANNEL);
            const infoChannel = client.channels.cache.get(INFO_CHANNEL);

            const updatedContent = 
`【 高山鐵道鐵道運行情報 / Takayama Railway 】\n
Host: <@${shift.host}>
Operation: ${shift.operation}
Note: ${shift.note}`;

            const scheduleMsg = await scheduleChannel.messages.fetch(shift.scheduleMessageId);
            await scheduleMsg.edit(updatedContent);
            const infoMsg = await infoChannel.messages.fetch(shift.infoMessageId);
            await infoMsg.edit(updatedContent);

            await interaction.reply({ content: `シフトID ${id} を更新しました`, ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
