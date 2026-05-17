import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { getSession } from "@/lib/auth";

// Correction LLM (Opus 4.6) des réponses libres (cloze, free-recall).
// Laxiste : accepte paraphrases, synonymes, fautes mineures, accents incomplets.
// Strict sur les chiffres-clés et les confusions de concepts.

export const maxDuration = 20;

const GradeSchema = z.object({
  correct: z.boolean(),
  feedback: z.string().min(1).max(400),
});

const SYSTEM = `Tu es un correcteur d'examens de médecine générale française.
Tu juges si la réponse d'un apprenant est CORRECTE par rapport à la (les) réponse(s) attendue(s).

RÈGLES DE LAXISME (être souple) :
- Accepter paraphrases, synonymes, formulations alternatives qui expriment la même idée.
- Accepter fautes d'orthographe mineures, accents manquants, casse différente.
- Accepter abréviations équivalentes (ex: "PA" pour "pression artérielle", "TA" pour "tension artérielle").
- Accepter une réponse partielle mais essentielle (si l'apprenant donne le mot-clé central).
- Pour un CHIFFRE : tolérance ±5 % pour valeurs continues (g/L, mmHg…) ; EXACT pour seuils diagnostiques explicites (140/90 ne tolère pas 130/90).

CAS DE REJET (être ferme) :
- Réponse à côté du sujet ou hors-sujet.
- Inversion d'un concept clé (ex: confondre systolique/diastolique).
- Confusion entre 2 entités proches mais distinctes (ex: HDL vs LDL).
- Pour une cloze attendant un mot précis, donner un mot qui change le sens.

RÉPONSE :
- "correct" : true ou false.
- "feedback" : 1 à 2 phrases en français, accessible.
  - Si correct : valide et précise pourquoi c'est juste (sans paraphraser bêtement).
  - Si incorrect : explique précisément en quoi la réponse diffère de l'attendu, sans culpabiliser.`;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await req.json()) as {
    kind: "cloze" | "free-recall";
    prompt: string;
    expected: string[];
    userAnswer: string;
    rationale?: string;
  };

  if (!body?.userAnswer?.trim()) {
    return Response.json({ correct: false, feedback: "Réponse vide." });
  }
  if (!Array.isArray(body.expected) || body.expected.length === 0) {
    return new Response("Missing expected answers", { status: 400 });
  }

  const expectedFmt = body.expected.map((e, i) => `  ${i + 1}. ${e}`).join("\n");

  const userPrompt = `TYPE DE QUESTION : ${body.kind === "cloze" ? "Texte à trous (un ou plusieurs mots / chiffres attendus dans l'ordre)" : "Rappel libre (liste d'items attendus, peu importe l'ordre)"}

ÉNONCÉ :
"""
${body.prompt}
"""

RÉPONSE(S) ATTENDUE(S) (référence) :
${expectedFmt}

${body.rationale ? `EXPLICATION DE RÉFÉRENCE (pour t'aider à juger la nuance) :\n"""\n${body.rationale}\n"""\n` : ""}
RÉPONSE DE L'APPRENANT :
"""
${body.userAnswer}
"""

Juge : la réponse de l'apprenant est-elle correcte (en étant LAXISTE mais pas naïf) ?`;

  const { object } = await generateObject({
    model: anthropic("claude-opus-4-6"),
    schema: GradeSchema,
    system: SYSTEM,
    prompt: userPrompt,
    temperature: 0.1,
  });

  return Response.json(object);
}
