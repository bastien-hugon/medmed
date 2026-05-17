import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { getSession } from "@/lib/auth";

// Tuteur médical contextualisé sur une lesson medmed.
// Haiku 4.5 pour la latence (BLUEPRINT pilier #10 "self-explanation").

export const maxDuration = 30; // Vercel : 30s max pour le stream

type LessonContext = {
  topic: string;
  cardId: string;
  prompt: string;
  rationale: string;
  sourceUrl: string;
  sourceVersion: string;
};

function buildSystemPrompt(ctx: LessonContext): string {
  return `Tu es un tuteur médical pour un apprenant français en autoformation de médecine générale.
Tu réponds aux questions sur la leçon ci-dessous, dans un style accessible, structuré, en français médical correct.
Tu restes dans le périmètre de la leçon sauf si une digression brève aide la compréhension. Si une question sort largement du cadre, redirige gentiment vers la leçon ou suggère que ce sera couvert plus tard.
Évite le jargon non défini. Tu peux utiliser des exemples concrets, des métaphores, et des comparaisons cliniques simples.
N'invente pas de chiffres ni de seuils que tu n'es pas certain ; si tu ne sais pas, dis-le.

---
Contexte de la leçon actuelle :

- Sujet : ${ctx.topic}
- Identifiant carte : ${ctx.cardId}
- Source citée : ${ctx.sourceUrl} (version ${ctx.sourceVersion})

Contenu de la leçon :
"""
${ctx.prompt}
"""

Pour aller plus loin (rationale interne, ne pas citer textuellement) :
"""
${ctx.rationale}
"""
---

Réponds de manière concise (typiquement 2-4 paragraphes courts ou une liste à puces si pertinent).`;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await req.json()) as {
    messages: UIMessage[];
    context: LessonContext;
  };

  if (!body?.context?.prompt) {
    return new Response("Missing lesson context", { status: 400 });
  }

  const system = buildSystemPrompt(body.context);
  const modelMessages = await convertToModelMessages(body.messages);

  const result = streamText({
    model: anthropic("claude-opus-4-6"),
    // Prompt caching sur le system prompt (contenu de la lesson stable au cours
    // du chat — économise tokens dès le 2ᵉ message dans la fenêtre de 5 min).
    system: [
      {
        role: "system",
        content: system,
        providerOptions: {
          anthropic: { cacheControl: { type: "ephemeral" } },
        },
      },
    ],
    messages: modelMessages,
    temperature: 0.4,
  });

  return result.toUIMessageStreamResponse();
}
