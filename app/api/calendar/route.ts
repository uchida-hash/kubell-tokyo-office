import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { addDays, startOfDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

const TZ = "Asia/Tokyo";
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? "primary";

// GET: 今後30日間のイベント取得
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accessToken = session.accessToken;
  if (!accessToken) {
    return NextResponse.json({ events: [] });
  }

  try {
    const nowJST = toZonedTime(new Date(), TZ);
    const timeMin = fromZonedTime(startOfDay(nowJST), TZ).toISOString();
    const timeMax = fromZonedTime(addDays(nowJST, 30), TZ).toISOString();

    const calendarId = encodeURIComponent(CALENDAR_ID);
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "50",
    });

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const err = await res.json();
      console.error("Calendar API error:", err);
      return NextResponse.json({ events: [] });
    }

    const data = await res.json();

    const events = (data.items ?? []).map((e: any) => ({
      id: e.id,
      title: e.summary ?? "(タイトルなし)",
      start: e.start?.dateTime ?? e.start?.date ?? "",
      end: e.end?.dateTime ?? e.end?.date ?? "",
      allDay: !e.start?.dateTime,
      description: e.description ?? "",
      location: e.location ?? "",
      htmlLink: e.htmlLink ?? "",
    }));

    return NextResponse.json({ events });
  } catch (err) {
    console.error("Calendar fetch error:", err);
    return NextResponse.json({ events: [] });
  }
}
