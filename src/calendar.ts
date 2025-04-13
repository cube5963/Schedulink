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

        const now = new Date();
        const startOfDay = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
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

        // 今日の日付を文字列で取得 (例: "2025-04-08")
        const todayDateString = startOfDay.toISOString().split('T')[0];

        return events
            .filter(event => {
                // 終日の予定の場合は日付が今日と一致するか確認
                if (event.start?.date) {
                    return event.start.date === todayDateString;
                }
                return true; // 時間指定の予定はそのまま含める
            })
            .map(event => {
                const start = event.start?.dateTime || event.start?.date;
                const formattedTime = start ? formatter.format(new Date(start)) : '終日';
                return `予定: ${event.summary} (${formattedTime})`;
            })
            .join('\n');
    } catch (error: any) {
        console.error('Google Calendar APIエラー:', error.message);
        if (error.response) {
            console.error('エラー詳細:', error.response.data.error);
        }
        return '予定を取得できませんでした。カレンダーIDやAPIキーを確認してください。';
    }
}