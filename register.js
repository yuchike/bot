require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
    new SlashCommandBuilder()
        .setName('shift')
        .setDescription('シフト管理')
        .addSubcommand(sub => 
            sub.setName('create')
                .setDescription('新規シフト作成')
                .addUserOption(opt => opt.setName('host').setDescription('ホスト').setRequired(true))
                .addStringOption(opt => opt.setName('operation').setDescription('運行名').setRequired(true))
                .addStringOption(opt => opt.setName('note').setDescription('備考')))
        .addSubcommand(sub =>
            sub.setName('edit')
                .setDescription('既存シフトを編集')
                .addStringOption(opt => opt.setName('id').setDescription('シフトID').setRequired(true))
                .addUserOption(opt => opt.setName('host').setDescription('新しいホスト'))
                .addStringOption(opt => opt.setName('operation').setDescription('新しい運行名'))
                .addStringOption(opt => opt.setName('note').setDescription('新しい備考')))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('コマンド登録中...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        console.log('コマンド登録完了');
    } catch (error) {
        console.error(error);
    }
})();
