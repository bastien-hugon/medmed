# medmed — Blueprint

> Plateforme perso d'apprentissage de la médecine générale française.
> Single-user, hébergée sur Vercel, PWA installable.
> Pas un Anki déguisé, pas un Duolingo de la médecine — un *medical reasoning trainer*.

## Vision en une phrase

Chaque session de 20-30 min mélange rappel actif, cas cliniques à étapes et arbres décisionnels exécutables, calibrée par un agent Claude Code qui apprend des erreurs.

## Décisions verrouillées

- **Hébergement** : Vercel (accès partout).
- **PWA** : installable, offline-capable pour les sessions de révision.
- **Single-user**, pas de SaaS.
- **Contenu** : généré par Claude Code (Opus 4.7) **strictement à partir** de sources officielles téléchargées (HAS, ebmfrance, LiSA, référentiels collèges). Aucune carte sans `source: { url, version }`.
- **Stack** : Next 16 + React 19 + Tailwind 4 + TypeScript. Storage : **Neon Postgres** via l'intégration Vercel native (`@neondatabase/serverless`, HTTP driver). Même DB en local et en prod (pull des env vars via `vercel env pull`).

## Partie 1 — Principes d'apprentissage (10 piliers)

Ordonnés par poids dans le design :

1. **FSRS-6 sur les faits durs, pas SM-2** — 20-30 % de reviews en moins à rétention équivalente. Cible 0.88-0.90, jamais 0.95+ (burnout).
2. **Active recall toujours, lecture jamais** — cloze + QCM-vignette (EDN/NBME) + rappel libre, en rotation. **Test immédiat après chaque lesson**, jamais 2 lessons consécutives sans quiz intermédiaire. Les échecs reviennent dans le pool actif de la session courante jusqu'à réussite — c'est seulement à la sortie de session que FSRS prend le relais pour le long terme.
3. **Interleaving forcé** — pas de "semaine cardio". Les sessions mélangent systèmes.
4. **Illness scripts** comme structure de donnée — "classe" typée par pathologie. Pas de fiche en prose.
5. **Cas cliniques à étapes révélées** — hypothèse forcée à chaque étape (anamnèse → examen → exams → dx → PEC).
6. **Script Concordance Tests** — vignette + hypothèse + nouvelle info → renforce/affaiblit/neutre.
7. **Difficulté adaptative ~85 % de réussite** (Wilson, *Nature Comms* 2019).
8. **Calibration métacognitive** — confidence 1-5 *avant* la réponse, dashboard d'écart confiance/exactitude.
9. **Microlearning 15-25 min** en 3-4 micro-blocs. Smallest unit of action = "2 cartes".
10. **Self-explanation après erreur** — l'app répond avec un feedback LLM contextualisé.

**Gamification** : filtre dur — une mécanique entre QUE si elle renforce ≥2 des 3 piliers SDT (autonomie / compétence / relatedness).

À garder : streak avec **freeze tokens** (Sharif & Shu), cas du jour à révélation variable, skill tree médical, illness scripts collectionnables (chaque "carte" est une vraie ressource consultable), mastery levels basés sur la **vraie** probabilité de rappel.

À bannir : leaderboard global, XP arbitraire, notifications culpabilisantes, streak punitif, loot boxes, badges cosmétiques.

## Partie 1bis — Séquenceur de session (rolling retrieval)

Le séquenceur a **deux horizons** combinés :

### Horizon court — intra-session (rolling retrieval)

Une session est une suite **Lesson → Quiz** strictement alternée. Le quiz couvre toujours le concept de la lesson qui vient d'être présentée, plus un retest des concepts précédents qui ont été ratés *dans cette session* :

```
Lesson A → Q(A)
Lesson B → Q(B) [+ retest A si A raté]
Lesson C → Q(C) [+ retest des A/B encore ratés]
…
```

Règles :
- Une carte ratée reste dans le pool actif de la session courante jusqu'à une réussite.
- Un concept maîtrisé du premier coup ne réapparaît pas en intra-session — FSRS décide quand le revoir.
- Si N lessons s'enchaînent sans test, c'est un bug du séquenceur, pas une feature.

Pourquoi : test immédiat = encodage (testing effect, Roediger & Karpicke). Errorful learning = la 2ème tentative consolide mieux que la lecture passive d'une explication.

### Horizon long — inter-session (FSRS-6)

À la sortie de session, chaque carte vue est notée (1-4) et son `next_review` est calculé par FSRS-6 avec rétention cible 0.88-0.90. Les retests intra-session ne polluent pas FSRS : seule la **dernière** réponse de la session compte pour la planification long terme.

### Implication pour la génération de contenu

Les cartes restent atomiques (1 concept testable par carte). Le séquenceur compose la session à partir du pool de cartes dues + nouvelles. Aucun "chapitre" ni "bloc de lessons" n'est pré-câblé dans le contenu — c'est l'algo qui interleave.

## Partie 2 — En quoi le projet aide, pendant la construction

1. **Encoder = apprendre** — formaliser un illness script en JSON oblige à comprendre. Du retrieval practice profond.
2. **Le format médecine ↔ dev résonne** — illness scripts = classes typées, algos HAS = state machines avec early-returns (red flags), diagnostic = inférence bayésienne (LR pré-test × likelihood ratio).
3. **Le feedback loop est un objet d'étude** — l'agent qui analyse tes erreurs identifie aussi tes biais cognitifs (anchoring, premature closure, availability). C'est la métacognition enseignée aux internes de MG.

## Partie 3 — Modèle de données

5 entités, toutes versionnées, toutes traçables.

```ts
// 1. Carte atomique (FSRS)
type Card = {
  id: string;
  kind: 'cloze' | 'qcm-vignette' | 'free-recall' | 'sct';
  prompt: string;
  expected: string | string[];
  rationale: string;
  tags: { system: string[]; sdd: string[]; item_edn: number[]; cnge_family: string[] };
  difficulty: 1 | 2 | 3;
  source: { kind: 'HAS' | 'CNGE' | 'NICE' | 'Pilly' | 'ebmfrance' | 'LiSA'; url: string; version: string };
};

// 2. Illness script
type IllnessScript = {
  id: string; name: string; icd10?: string;
  predisposing: string[];
  pathophysiology: string;
  clinical_features: { symptoms: string[]; signs: string[]; biology?: string[] };
  typical_course: string;
  discriminators: { vs: string; key: string }[];
  red_flags: string[];
  workup: string[];
  management: { first_line: string[]; second_line?: string[]; referral?: string };
  sources: Source[];
};

// 3. Arbre décisionnel
type DecisionTree = {
  id: string; trigger: string;
  red_flag_gate: string[];     // early-return checklist
  nodes: Node[];                // graph JSON-serialisable
  source: Source;
};

// 4. Cas clinique
type Case = {
  id: string; difficulty: 1 | 2 | 3;
  stages: Stage[];              // anamnèse → examen → exams → dx → PEC
  hidden_diagnosis: string;
  differential: string[];
  expected_reasoning_steps: string[];
  family_tags: string[];        // familles CNGE
};

// 5. Session
type Session = {
  id: string; date: string;
  blocks: Block[];
  metrics: { duration_ms: number; correctness: number; calibration: number };
  llm_notes?: string;
};
```

**Non négociable** : chaque entité porte une source (URL + version). Aucun contenu sans citation vérifiable.

## Partie 4 — Découpage du curriculum

- **Axe principal — motifs de consultation ECOGEN** : top 30 motifs = 50 % de l'activité réelle (HTA, lombalgie, céphalée, asthénie, toux chronique, douleur thoracique, dépression, anxiété, fièvre enfant, IST, contraception, etc.).
- **Axe secondaire — par appareil** (16 modules) : pour navigation/complétude. Pas l'unité d'étude.
- **Axe transversal — 6 compétences CNGE** : taggées par cas, dashboard des compétences sous-travaillées.

### Sources prioritaires (à cacher dans `/sources/`)

- **HAS** — recommandations + PDF d'arbres officiels.
- **ebmfrance.net** — 1 100+ guides MG (pendant français d'UpToDate).
- **LiSA / UNESS** — 367 items rang A/B/C.
- **Antibioclic** — logique de prescription antibiotique.
- **RecoMédicales** — scores cliniques.
- **Pilly étudiant 2023** — infectieux.
- **Référentiels collèges** — CNGE, CNGOF, CEEDMM, etc.

### Anatomie/physio

Juste-en-temps dans la leçon clinique. Jamais en silos.

## Partie 5 — Feedback loop Claude Code

### `/medmed-analyze`

À la fin d'une session ou en hebdo, l'agent :
1. Lit le journal (Session JSON + cartes vues + réponses + temps + confiance).
2. Identifie : leech cards, biais cognitifs récurrents, écart confiance/exactitude, compétences CNGE sous-travaillées.
3. Génère : cartes alternatives, cas synthétique pour drill un point faible, plan de session du lendemain.

### `/medmed-generate`

- Input : thème (item EDN, SDD, motif), nombre de cartes/cas, niveau.
- Lit les sources locales (`/sources/`), demande à **Opus 4.7** de générer strictement à partir des sources fournies avec citation obligatoire.
- Valide contre Zod, stage en **pending review**. Tu valides à la main → airlock anti-hallucination.

### `/medmed-verify`

Cron hebdo : URLs sources répondent encore, hashs n'ont pas bougé. Sinon → flag "à revérifier".

### Architecture LLM

- Pas de LLM live pour générer du contenu pédagogique en session.
- **Opus 4.7** : génération de contenu (qualité, audit).
- **Haiku 4.5** : feedback temps réel sur self-explanation (latence).
- Wrapper unique qui logue chaque appel.

## Partie 6 — Plan d'exécution par phases

| Phase | Durée | Livrable |
|---|---|---|
| **0 — Squelette** | 1-2j | Stack Next 16 + Tailwind 4 + Turso + Zod. Schémas des 5 entités. Auth single-user. PWA manifest. Déploiement Vercel initial. |
| **1 — Moteur minimal** | 1 sem | FSRS-6 (`ts-fsrs`), UI session, 20 cartes seed sur **HTA** (motif d'attaque). Première vraie session 15 min. |
| **2 — Illness scripts + cas** | 1 sem | Viewer script structuré, cas cliniques à étapes, feedback Haiku temps réel. 3 cas seed HTA. |
| **3 — Arbres décisionnels** | 1 sem | DSL JSON + viewer interactif. Arbre HAS lombalgie. Modes "marche" et "construis". |
| **4 — Feedback loop** | 1 sem | Skills Claude Code `/medmed-analyze` et `/medmed-generate`. Détection leech + biais (heuristiques simples). |
| **5 — Gamification saine** | 1 sem | Streak + freeze, calendrier organes, cas du jour à reveal variable, skill tree, mastery levels réels. |
| **6 — Élargissement contenu** | continu | Top 30 motifs ECOGEN, ~1 motif/sprint. Génération via `/medmed-generate`, review manuelle. ~6 mois pour 80 % de l'activité MG. |
| **7 — Métacognition fine** | plus tard | Dashboard calibration, analyse de biais cumulés, détection de plateaus → switch de format auto. |

## Partie 7 — Anti-patterns gravés dans le marbre

1. Pas de contenu sans source citée (URL + version).
2. Pas de fiche en prose — cartes structurées + illness scripts typés uniquement.
3. Pas de "semaine cardio" / blocked practice par défaut.
4. Pas de streak punitif, pas de notification culpabilisante.
5. Pas de leaderboard, pas d'XP achetable, pas de badge cosmétique.
6. Pas de LLM live pour générer du contenu pédagogique sans validation.
7. Pas d'anatomie en silos.
8. Pas de rétention FSRS > 0.92.
9. Pas de 200 cartes/jour. Plafond nouvelles ≤ 15/j, dues capées à 80.
10. Pas de feature qui marcherait avec du contenu nul — règle de validation ultime.

## Sources de référence (recherche initiale)

### Sciences de l'apprentissage
- Retrieval Practice — MDPI 2025 https://www.mdpi.com/2076-328X/15/7/974
- FSRS Optimal Retention Wiki https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-optimal-retention
- The Eighty Five Percent Rule — Wilson, *Nature Comms* 2019 https://www.nature.com/articles/s41467-019-12552-4
- Illness Scripts RCT — BMC Med Educ 2021 https://link.springer.com/article/10.1186/s12909-021-02522-0
- Microlearning scoping review — JMIR Med Educ https://mededu.jmir.org/2019/2/e13997/

### Curriculum France
- Arrêté DES MG 3 août 2023 (4 ans) — FHF
- Marguerite des compétences CNGE — DMG Nantes https://dmg.univ-nantes.fr/storage/256/Marguerite_MEDECINE_GENERALE_1909_1.pdf
- 11 familles de situations — DMG Paris https://dmg-u-paris.fr/p/les-11-familles-de-situation
- Programme R2C / 367 items — MESRI
- LiSA UNESS https://livret.uness.fr/lisa/
- HAS https://www.has-sante.fr/
- ebmfrance.net https://www.ebmfrance.net/
- ECOGEN top motifs — Revue Exercer https://www.exercer.fr/full_article/613
- Antibioclic https://antibioclic.com/
- RecoMédicales scores https://recomedicales.fr/scores/

### Raisonnement clinique
- Norman — Dual process models, *J Eval Clin Pract* 2024 https://onlinelibrary.wiley.com/doi/10.1111/jep.13998
- Pelaccia — Reasoning model, *Med Educ Online* 2011
- Cognitive biases — CCJM 2015
- Clinical Reasoning Org https://clinicalreasoning.org/
- NICE Guidelines https://www.nice.org.uk/guidance
- MDCalc https://www.mdcalc.com/
- Peleg — Computer-interpretable guideline formalisms 2008
- MedDM — LLM-executable clinical guidance trees, arXiv 2312.02441

### Gamification & habitudes
- Atomic Habits — James Clear https://jamesclear.com/atomic-habits-summary
- BJ Fogg Behavior Model https://www.behaviormodel.org/
- Sharif & Shu — Emergency reserves (streak freeze) — Wharton
- Yu-kai Chou — PBL Fallacy https://yukaichou.com/gamification-study/points-badges-and-leaderboards-the-gamification-fallacy/
- Self-Determination Theory — Deci & Ryan
- Mekler et al. — PBL & intrinsic motivation
- BMC Med Ed 2025 — Gamification in clinical reasoning scoping review
- Picmonic — Mnemonic learning RCT — PMC4029202

## Décisions ouvertes restantes

1. **Auth single-user** : password env + signed cookie minimaliste, ou Vercel password protection ? → à trancher en Phase 0.
2. **Premier motif d'attaque** : HTA recommandé (algo HAS clair, top 1 ECOGEN, bien borné). Alternatives : lombalgie, céphalée.
3. **Notifications push** : Web Push via PWA (faisable sur iOS 16.4+ et Android).
