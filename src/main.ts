import { Client, GatewayIntentBits, Partials } from 'discord.js'
import dotenv from 'dotenv'
import { google } from 'googleapis';
//import { setcmd } from './register_cmd'
import { getEvents } from './calendar';

dotenv.config()

const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
})

const notifyTime = process.env.NOTIFY_TIME || '00:00';


function notification() {
    const [hour, minute] = notifyTime.split(':').map(Number);

    setInterval(async () => {
        const now = new Date();
        const tokyoTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));

        if (tokyoTime.getHours() === hour && tokyoTime.getMinutes() === minute) {
            const response = await getEvents();

            // 通知を送信するチャンネルIDを指定 (環境変数から取得)
            const channelId = process.env.NOTIFY_CHANNEL_ID;
            if (channelId) {
                const channel = client.channels.cache.get(channelId);
                if (channel?.isTextBased() && 'send' in channel) {
                    channel.send(response);
                } 
            } else {
                console.error('通知チャンネルIDが設定されていません。');
            }
        }
    }, 60 * 1000); // 1分ごとにチェック
}

client.once('ready', async () => {
    //await setcmd()
    console.log('Ready!')
    if (client.user) {
        console.log(client.user.tag)
    }
    notification(); // 毎日通知のスケジュールを開始
})

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return
    /*if (message.content === "cal") {
        const response = await getTodayEvents();
        message.reply(response);
    }*/
});

client.login(process.env.TOKEN)