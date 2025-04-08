import { REST, Routes } from 'discord.js'
import dotenv from 'dotenv'
dotenv.config()

const commands = [
    {
        name: "create",
        description: "予定生成します",
        options: [
            {
                name: "title",
                description: "タイトル",
                type: 3,
                required: true
            },
            {
                name: "question",
                description: "質問",
                type: 3,
                required: true
            },
            {
                name: "question_content",
                description: "質問詳細",
                type: 3,
                required: true
            },
            {
                name: "answer",
                description: "回答",
                type: 3,
                required: true
            },
            {
                name: "answer_content",
                description: "質問詳細",
                type: 3,
                required: true
            },
        ]
    }
]

if (!process.env.TOKEN) {
    throw new Error('TOKEN is not defined in the environment variables');
}

if (!process.env.client_id) {
    throw new Error('CLIENT_ID is not defined in the environment variables');
}


const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

export async function setcmd(): Promise<void> {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.client_id as string),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
        return;
    } catch (error) {
        console.error(error);
        return;
    }
}