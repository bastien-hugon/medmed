import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { getSession } from "@/lib/auth";
import { getNote, saveNote } from "@/lib/notes";

// Génère un récap condensé d'une lesson pour faciliter la prise de notes.
// Cache 1-1 par carte : la 2ᵉ demande sur la même lesson renvoie l'existant.

export const maxDuration = 30;

const MODEL_ID = "claude-opus-4-6";

const SYSTEM = `Tu es un assistant qui condense des leçons médicales en notes mémorables pour un apprenant en médecine générale française.

OBJECTIF : produire une fiche très courte que l'apprenant peut RECOPIER dans son cahier en 1-2 minutes.

FORMAT obligatoire — markdown léger :
- 4 à 7 puces commençant par "- "
- Mots-clés en **gras** (Markdown **texte**)
- Chiffres / seuils / doses en **gras**
- Si pertinent, max 1 sous-puce de précision par puce principale (indentation 2 espaces)
- Pas de titre, pas d'intro, pas de conclusion — directement les puces

CONTRAINTES :
- Français médical correct
- Pas de paraphrase verbeuse : un point = une idée
- Garder les définitions essentielles, les seuils chiffrés exacts, les pièges cliniques
- N'invente RIEN qui ne soit dans la leçon. Si la leçon ne donne pas un chiffre, ne le sors pas d'ailleurs.
- Pas d'emoji.`;

function buildPrompt(prompt: string, rationale: string): string {
  return `LEÇON :
"""
${prompt}
"""

POUR ALLER PLUS LOIN (compléments à ne pas tous restituer) :
"""
${rationale}
"""

Produis maintenant la fiche de prise de notes — uniquement les puces, rien d'autre.`;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json()) as {
    cardId: string;
    prompt: string;
    rationale: string;
    regenerate?: boolean;
  };
  if (!body?.cardId || !body?.prompt) {
    return new Response("Missing cardId or prompt", { status: 400 });
  }

  // Cache hit
  if (!body.regenerate) {
    const cached = await getNote(body.cardId);
    if (cached) {
      return Response.json({
        content: cached.content,
        model: cached.model,
        cached: true,
        generatedAt: cached.generatedAt,
      });
    }
  }

  const { text } = await generateText({
    model: anthropic(MODEL_ID),
    system: SYSTEM,
    prompt: buildPrompt(body.prompt, body.rationale ?? ""),
    temperature: 0.2,
  });

  await saveNote(body.cardId, text, MODEL_ID);

  return Response.json({
    content: text,
    model: MODEL_ID,
    cached: false,
    generatedAt: Date.now(),
  });
}
