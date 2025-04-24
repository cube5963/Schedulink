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

        const events = res.data.items || [];

        const nextDayStart = new Date(startOfDay);
        nextDayStart.setDate(nextDayStart.getDate() + 1);
        const nextDayEnd = new Date(nextDayStart);
        nextDayEnd.setHours(23, 59, 59, 999);

        const nextDayRes = await calendar.events.list({
            calendarId: calendarId,
            timeMin: nextDayStart.toISOString(),
            timeMax: nextDayEnd.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const nextDayEvents = nextDayRes.data.items || [];

        const formatter = new Intl.DateTimeFormat('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Tokyo',
        });

        const todayDateString = startOfDay.toISOString().split('T')[0];
        const nextDayDateString = nextDayStart.toISOString().split('T')[0];

        const filteredEvents = events.filter(event => {
            if (event.start?.date) {
                return event.start.date === todayDateString;
            }
            return true;
        });

        const filteredNextDayEvents = nextDayEvents.filter(event => {
            if (event.start?.date) {
                return event.start.date === nextDayDateString;
            }
            return true;
        });

        // 今日の予定の最後と次の日の予定の最初を比較して同じなら今日の予定から削除
        if (filteredEvents.length > 0 && filteredNextDayEvents.length > 0) {
            const lastTodayEvent = filteredEvents[filteredEvents.length - 1];
            const firstNextDayEvent = filteredNextDayEvents[0];

            const lastTodayEventTime = lastTodayEvent.start?.dateTime || lastTodayEvent.start?.date;
            const firstNextDayEventTime = firstNextDayEvent.start?.dateTime || firstNextDayEvent.start?.date;

            if (lastTodayEventTime && firstNextDayEventTime && new Date(lastTodayEventTime).getTime() === new Date(firstNextDayEventTime).getTime()) {
                filteredEvents.pop();
            }
        }

        const formattedEvents = filteredEvents.map(event => {
            const start = event.start?.dateTime || event.start?.date;
            const formattedTime = start ? formatter.format(new Date(start)) : '終日';
            return `予定: ${event.summary} (${formattedTime})`;
        });

        const formattedNextDayEvents = filteredNextDayEvents.map(event => {
            const start = event.start?.dateTime || event.start?.date;
            const formattedTime = start ? formatter.format(new Date(start)) : '終日';
            //次の日の予定を表示しない
            return '';
        });

        return formattedEvents.concat(formattedNextDayEvents).join('\n');
    } catch (error: any) {
        console.error('Google Calendar APIエラー:', error.message);
        if (error.response) {
            console.error('エラー詳細:', error.response.data.error);
        }
        return '予定を取得できませんでした。カレンダーIDやAPIキーを確認してください。';
    }
}