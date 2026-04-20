import OpenAI from "openai";
import { checkContent } from "../../../lib/contentFilter";
import { isBanned, recordViolation } from "../../../lib/violationTracker";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const FREE_STORY_LIMIT = 3;

type GenerateRequest = {
  genre: string;
  style: string;
  length: string;
  comments?: string;
  storiesUsed?: number;
  sessionId?: string;
  familyUnlocked?: boolean;
  ageVerified?: boolean;
  layer?: "main" | "forbidden";
};

function wordCount(length: string): string {
  if (length.includes("30")) return "4000-5000 words";
  if (length.includes("20")) return "2500-3000 words";
  return "1200-1500 words";
}

function maxTokens(length: string): number {
  if (length.includes("30")) return 7000;
  if (length.includes("20")) return 4500;
  return 2500;
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY?.trim()) {
      return Response.json({ error: "Server configuration error." }, { status: 500 });
    }

    const body: GenerateRequest = await req.json();
    const {
      genre,
      style,
      length = "Short (10 min)",
      comments,
      storiesUsed = 0,
      sessionId = "anonymous",
      familyUnlocked = false,
      ageVerified = false,
      layer = "main",
    } = body;

    if (!ageVerified) {
      return Response.json({ error: "AGE_VERIFICATION_REQUIRED" }, { status: 403 });
    }

    if (await isBanned(sessionId)) {
      return Response.json({ error: "ACCESS_SUSPENDED" }, { status: 403 });
    }

    if (!familyUnlocked && storiesUsed >= FREE_STORY_LIMIT) {
      return Response.json({ error: "STORY_LIMIT_REACHED" }, { status: 403 });
    }

    const textToCheck = `${genre} ${style} ${comments ?? ""}`;
    const safetyResult = checkContent(textToCheck);

    if (!safetyResult.safe) {
      const { banned, violationCount } = await recordViolation(sessionId, safetyResult.highSeverity);
      if (banned) return Response.json({ error: "ACCESS_SUSPENDED" }, { status: 403 });
      return Response.json(
        {
          error: "CONTENT_VIOLATION",
          message: "That content is not permitted.",
          warningsRemaining: Math.max(0, 2 - violationCount),
        },
        { status: 400 },
      );
    }

    const isVelvet = layer === "forbidden";

    const systemPrompt = isVelvet
      ? "You are a sophisticated adult fiction author writing for an adults-only platform. You may write explicit erotic fiction involving consenting adults only. Never write content involving minors, incest, animals, necrophilia, or non-consensual sexual activity. Maintain literary quality and emotional coherence."
      : "You are a sophisticated adult fiction author. You write immersive, atmospheric, mature fiction for adult readers. Content may be dark, suspenseful, romantic, or sensual, but it should stop short of explicit sexual detail. Maintain literary quality, emotional tension, and a satisfying ending.";

    const contentGuidelines = isVelvet
      ? "CONTENT: Explicit adult fiction is permitted where appropriate. All intimate content must clearly involve consenting adults only."
      : "CONTENT: Mature adult fiction with atmosphere, tension, and emotional depth. Keep it sensual or suggestive rather than explicit.";

    const prompt = `Write an original adult story with these specifications:

STORY SETTINGS:
- Genre: ${genre || "Dark atmospheric fiction"}
- Style/Tone: ${style || "Darkly atmospheric and cinematic"}
- Length: ${wordCount(length)}
- Additional details: ${comments || "None provided. Use your creative judgment."}

${contentGuidelines}

WRITING GOALS:
- Rich, evocative prose
- Strong atmosphere and emotional depth
- Well-developed characters
- Clear narrative arc with a satisfying ending
- Use the requested length fully

Write the story now.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens(length),
    });

    const story = response.choices[0]?.message?.content || "Sorry, no story was generated.";
    return Response.json({ story });
  } catch (error) {
    console.error("[generate-story]", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
