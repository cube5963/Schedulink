import dotenv from 'dotenv'
import { google } from 'googleapis';

dotenv.config()

const apiKey = process.env.API_KEY;
const calendarId = process.env.CALENDAR_ID || 'primary';
const notifyTime = process.env.NOTIFY_TIME || '00:00';
const notifyChannelId = process.env.NOTIFY_CHANNEL_ID;

export async function getEvents() {
    try {
        const calendar = google.calendar({ version: 'v3', auth: apiKey });

        const noew = new Date();
        const startOfDay = new Date(noew.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);

        const res = await calendar.events.list({
            calendarId: calendarId,
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = res.data.items;
        if (!events || events.length === 0) {
            return '今日の予定はありません。';
        }

        const formatter = new Intl.DateTimeFormat('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Tokyo',
        });

        return events.map(event => {
            const start = event.start?.dateTime || event.start?.date;
            const formattedTime = start ? formatter.format(new Date(start)) : '不明な時間';
            return `予定: ${event.summary} (${formattedTime})`;
        }).join('\n');
    } catch (error: any) {
        console.error('Google Calendar APIエラー:', error.message);
        if (error.response) {
            console.error('エラー詳細:', error.response.data.error);
        }
        return '予定を取得できませんでした。カレンダーIDやAPIキーを確認してください。';
    }
}