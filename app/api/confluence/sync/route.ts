import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";
import { parse } from "node-html-parser";
import type { UserProfile } from "@/types";

const BASE_URL = process.env.CONFLUENCE_BASE_URL!;
const EMAIL = process.env.CONFLUENCE_EMAIL!;
const TOKEN = process.env.CONFLUENCE_API_TOKEN!;
const SPACE = process.env.CONFLUENCE_SPACE ?? "deptemp";

function authHeader() {
  return "Basic " + Buffer.from(`${EMAIL}:${TOKEN}`).toString("base64");
}

/** Extract plain text from HTML, stripping tags */
function text(html: string): string {
  return parse(html).text.replace(/\s+/g, " ").trim();
}

/** Collect all <li> text values under a heading */
function liTexts(items: ReturnType<typeof parse>): string[] {
  return items
    .querySelectorAll("li")
    .map((li) => li.text.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function parseProfile(html: string): Partial<UserProfile> {
  const root = parse(html);
  const profile: Partial<UserProfile> = {};

  // Build a map of h2 title → next sibling ul element
  const sections: Record<string, string> = {};
  root.querySelectorAll("h2").forEach((h2) => {
    const title = h2.text.replace(/\s+/g, " ").trim();
    // Collect all ul/ol siblings until next h2/h1
    let sibling = h2.nextElementSibling;
    const parts: string[] = [];
    while (sibling && !["H1", "H2"].includes(sibling.tagName)) {
      parts.push(sibling.outerHTML);
      sibling = sibling.nextElementSibling;
    }
    sections[title] = parts.join("");
  });

  // 所属部署
  const dept = sections["所属部署"] ?? "";
  if (dept) {
    const deptRoot = parse(dept);
    const allLi = deptRoot.querySelectorAll("li");
    const deptName = allLi.find((li) => li.text.includes("部署名"))?.text
      .replace(/部署名\s*[:：]\s*/, "").trim();
    if (deptName) profile.department = deptName;

    const jobLi = allLi.find((li) => li.text.includes("仕事内容"));
    if (jobLi) {
      // sub-items after 仕事内容
      const subItems = jobLi.querySelectorAll("li").map((l) => l.text.trim()).filter(Boolean);
      if (subItems.length) profile.jobDescription = subItems.join("、");
    }

    const relLi = allLi.find((li) => li.text.includes("関わりが深いメンバー"));
    if (relLi) {
      const subItems = relLi.querySelectorAll("li").map((l) => l.text.trim()).filter(Boolean);
      if (subItems.length) profile.relatedMembers = subItems.join("、");
    }
  }

  // 入社日・職歴
  const joinSection = sections["Chatwork入社日とそれ以前のこと"] ?? "";
  if (joinSection) {
    const joinRoot = parse(joinSection);
    const allLi = joinRoot.querySelectorAll("li");

    const joinLi = allLi.find((li) => li.text.includes("入社年月日"));
    if (joinLi) {
      const sub = joinLi.querySelectorAll("li").map((l) => l.text.trim()).filter(Boolean);
      if (sub.length) profile.joinDate = sub[0];
    }

    const careerLi = allLi.find((li) => li.text.includes("職歴"));
    if (careerLi) {
      const sub = careerLi.querySelectorAll("li").map((l) => l.text.trim()).filter(Boolean);
      if (sub.length) profile.careerHistory = sub.join("、");
    }
  }

  // 誕生日
  const birthdaySection = sections["誕生日"] ?? "";
  if (birthdaySection) {
    const items = liTexts(parse(birthdaySection));
    if (items.length) profile.birthday = items[0];
  }

  // 出身地
  const hometownSection =
    sections["出身地と住んでいる所"] ?? sections["出身地"] ?? "";
  if (hometownSection) {
    const hRoot = parse(hometownSection);
    const allLi = hRoot.querySelectorAll("li");
    const hLi = allLi.find((li) => li.text.includes("出身"));
    if (hLi) profile.hometown = hLi.text.replace(/出身\s*/, "").trim();

    const areaLi = allLi.find((li) => li.text.includes("出没エリア"));
    if (areaLi) {
      const sub = areaLi.querySelectorAll("li").map((l) => l.text.trim()).filter(Boolean);
      if (sub.length) profile.currentArea = sub.join("、");
    }
  }

  // 性格
  const personalitySection = sections["性格"] ?? "";
  if (personalitySection) {
    const items = liTexts(parse(personalitySection));
    profile.personality = items.join(" / ");
  }

  // 言語
  const langSection = sections["言語"] ?? "";
  if (langSection) {
    profile.languages = liTexts(parse(langSection)).join("、");
  }

  // 特技
  const skillSection = sections["特技"] ?? "";
  if (skillSection) {
    profile.specialSkills = liTexts(parse(skillSection)).join("、");
  }

  // 趣味
  const hobbySection = sections["趣味"] ?? "";
  if (hobbySection) {
    profile.hobbies = liTexts(parse(hobbySection)).join("、");
  }

  // 好きな食べ物
  const favFoodSection = sections["好きな食べ物"] ?? "";
  if (favFoodSection) {
    profile.favoriteFood = liTexts(parse(favFoodSection)).join("、");
  }

  // 苦手な食べ物
  const dislikedFoodSection = sections["苦手な食べ物"] ?? "";
  if (dislikedFoodSection) {
    profile.dislikedFood = liTexts(parse(dislikedFoodSection)).join("、");
  }

  // 最近はやっているもの
  const recentSection =
    sections["最近、自分の中ではやっているもの"] ??
    sections["最近はやっているもの"] ?? "";
  if (recentSection) {
    profile.recentInterests = liTexts(parse(recentSection)).join("、");
  }

  // 週末
  const weekendSection =
    sections["週末には何をしていますか？"] ?? sections["週末"] ?? "";
  if (weekendSection) {
    profile.weekends = liTexts(parse(weekendSection)).join("、");
  }

  // 他にあればどうぞ
  const freeSection =
    sections["他にあればどうぞ☆"] ??
    sections["他にあればどうぞ"] ??
    sections["その他"] ?? "";
  if (freeSection) {
    profile.freeText = text(freeSection);
  }

  return profile;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get user's confluencePageUrl from Firestore
  const snap = await adminDb.collection("users").doc(session.user.email).get();
  const userData = snap.data() ?? {};
  let pageId: string | null = null;

  if (userData.confluencePageUrl) {
    // Extract page ID from URL: .../pages/123456789
    const match = userData.confluencePageUrl.match(/\/pages\/(\d+)/);
    if (match) pageId = match[1];
  }

  // If no page URL, search by name in the space
  if (!pageId && session.user.name) {
    const encodedName = encodeURIComponent(session.user.name);
    const searchRes = await fetch(
      `${BASE_URL}/wiki/rest/api/content/search?cql=space="${SPACE}"+AND+title+~+"${encodedName}"&limit=1`,
      { headers: { Authorization: authHeader(), Accept: "application/json" } }
    );
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.results?.[0]?.id) {
        pageId = searchData.results[0].id;
      }
    }
  }

  if (!pageId) {
    return NextResponse.json(
      { error: "Confluenceページが見つかりませんでした。プロフィールにページURLを設定してください。" },
      { status: 404 }
    );
  }

  const res = await fetch(
    `${BASE_URL}/wiki/rest/api/content/${pageId}?expand=body.storage`,
    { headers: { Authorization: authHeader(), Accept: "application/json" } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Confluenceページの取得に失敗しました。" }, { status: 502 });
  }

  const data = await res.json();
  const html = data.body?.storage?.value ?? "";
  const profile = parseProfile(html);

  return NextResponse.json({ profile });
}
