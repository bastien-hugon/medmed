---
name: medmed-generate
description: Generate medmed flashcards (lessons + quizzes) from local source documents, following the project's pedagogical principles and Zod schema. Use when the user wants to add cards on a new topic, expand an existing layer, or fill in gaps. Always writes to content/cards/<topic>/pending/ for human review before activation.
---

# medmed-generate

Génère des cartes d'apprentissage médical structurées, **strictement à partir des sources officielles** présentes dans `sources/`. Chaque carte doit citer sa source avec URL + version. Aucune hallucination tolérée.

## Quand l'invoquer

L'utilisateur dit par exemple :
- « génère 10 cartes sur la lombalgie C1 »
- « ajoute 5 lessons + 5 quizzes sur le diabète T2 niveau fondations »
- « écris des cartes pour le motif fièvre chez l'enfant à partir des recos NICE »
- « complète la couche C2 de l'HTA »
- ou simplement `/medmed-generate` avec un sujet en arg

## Workflow

### Étape 1 — Comprendre la demande

Demande à l'utilisateur (si pas clair) :
- **Topic** (HTA, lombalgie, diabète T2, etc. → matche le nom de sous-dir dans `content/cards/`)
- **Couche** : C1 fondations / C2 clinique de base / C3 pratique clinique / C4 cas complexes
- **Nombre de cartes** (défaut : 10)
- **Distribution** (défaut : ~50% lessons, ~50% quizzes, mais ajuste selon la couche)

### Étape 2 — Lire les sources disponibles

```
ls sources/**/<topic>/
```

Lis le contenu pertinent avec `Read`. Si plusieurs PDFs/MDs, prioriser :
1. **HAS** (autorité de référence en France)
2. **ESC / NICE / référentiels collèges** (pour valeurs seuils internationales)
3. **ebmfrance** (synthèses MG)

Si **aucune source** disponible pour le topic, **stoppe** et dis à l'utilisateur ce qu'il doit télécharger d'abord. Ne génère JAMAIS de cartes sans source matérialisée localement.

### Étape 3 — Lire les exemples existants

Lis 3-5 cartes déjà actives dans `content/cards/<topic>/` (ou un topic voisin si vide) pour calquer le style. Exemples à modeler : `content/cards/hta/c1-01a-l-coeur-pompe.json`, `content/cards/hta/c1-02b-q-arteres-veines.json`.

Aussi : lis `lib/schemas.ts` (la source de vérité du schéma Zod).

### Étape 4 — Plan de cartes

Avant d'écrire, **propose un plan** sous forme de liste :

```
C2 — Mécanismes & clinique de base HTA (10 cartes)
1. (Lesson) Cycle cardiaque détaillé : systole / diastole / volume d'éjection
2. (QCM) Quel chiffre représente le volume éjecté à chaque battement ?
3. (Lesson) Système rénine-angiotensine-aldostérone (SRAA) expliqué
4. (Cloze) "L'hormone qui contracte les vaisseaux et fait monter la PA = ___"
...
```

L'utilisateur valide ou ajuste. Tu **ne génères les JSON** qu'après accord.

### Étape 5 — Génération

Pour chaque carte :

#### Naming
Fichiers dans `content/cards/<topic>/pending/` avec convention :
```
c{layer}-{nn}{letter}-{kind-prefix}-{slug}.json
```
- `layer` : 1, 2, 3, 4
- `nn` : numéro de concept (01-99, en ordre pédagogique)
- `letter` : a (lesson), b (1er quiz), c (2e quiz du même concept), etc.
- `kind-prefix` : `l` (lesson), `q` (quiz peu importe son sous-type)
- `slug` : kebab-case du concept

Exemples : `c2-03a-l-srra-mecanisme.json`, `c2-03b-q-srra-effet.json`

Cet ordre garantit que `seed.ts` (qui processe les fichiers alphabétiquement) crée les `created_at` dans l'ordre pédagogique : leçon avant ses quizzes, concept N avant concept N+1.

#### Schéma à respecter (cf. `lib/schemas.ts`)

```json
{
  "id": "hta-c2-03a-l-srra-mecanisme",
  "kind": "lesson | cloze | qcm-vignette | free-recall | sct",
  "prompt": "Texte de la leçon ou question. Pour les leçons, peut faire 3-6 paragraphes séparés par \\n\\n.",
  "expected": [...],  // selon kind, voir ci-dessous
  "rationale": "Explication / contexte / pièges / mnémo.",
  "tags": {
    "system": ["cardiovasculaire", "endocrinologie", "..."],
    "sdd": ["HTA", "..."],
    "item_edn": [224],
    "cnge_family": ["fondations" | "chroniques" | "urgences" | "prevention" | ...]
  },
  "difficulty": 1 | 2 | 3,
  "source": {
    "kind": "HAS" | "CNGE" | "NICE" | "Pilly" | "ebmfrance" | "LiSA" | "ESC" | "other",
    "url": "https://...",
    "version": "2024 | 2024 - mise à jour 2025 | etc."
  }
}
```

Champs spécifiques par `kind` :
- **lesson** : pas d'`expected`
- **cloze** : `expected: string[]` (un élément par blanc, en ordre)
- **qcm-vignette** : ajouter `choices: [{id, text, correct}]` + `expected: [id_correct]`
- **free-recall** : `expected: string[]` (liste des items attendus)
- **sct** : ajouter `hypothesis`, `new_info`, et `expected: "renforce" | "affaiblit" | "neutre"` (string, pas array)

#### Règles pédagogiques NON NÉGOCIABLES

1. **Lecon AVANT quiz sur le même concept**. Si tu introduis un terme dans une lesson, la 1ère quiz qui le teste doit être une **QCM** (reconnaissance), pas une cloze (rappel pur).
2. **Cloze uniquement quand un seul mot/nombre est attendu sans ambiguïté** (ex: chiffres, abréviations uniques). Sinon QCM.
3. **Pas de jargon non défini**. Tout acronyme (IEC, MAPA, SRAA, EAL...) doit avoir été introduit par une lesson antérieure ou défini inline dans la carte.
4. **Difficulty 1 = accessible depuis zéro**. Imagine que l'utilisateur n'a aucune notion de bio/physio. Ne suppose RIEN.
5. **Sources réelles uniquement**. URL valide, version vérifiable. Si tu ne trouves pas dans les sources locales, marque la carte comme `status: "pending-review"` avec note dans `rationale` "À vérifier : source X non trouvée".
6. **Rationale obligatoire**. Pas juste une définition — un complément pédagogique : pièges, mnémo, conséquences pratiques, lien avec d'autres concepts.
7. **Français médical correct**. Pas d'anglicismes (sauf si terme consacré : EBM, etc.).
8. **Une carte = un concept testable**. Pas de quiz qui teste 4 trucs à la fois.

### Étape 6 — Écriture des fichiers

Crée `content/cards/<topic>/pending/` si absent. Écris chaque carte dans un fichier JSON séparé.

### Étape 7 — Rapport

Affiche un rapport à l'utilisateur :

```
✓ Généré 10 cartes dans content/cards/hta/pending/
  - 5 lessons, 4 QCM, 1 cloze
  - Difficulty 2 (C2 — Mécanismes & clinique de base)
  - Sources utilisées : HAS reco 2024, ESC 2024

Pour valider :
  1. Review chaque fichier dans content/cards/hta/pending/
  2. Supprime celles qui ne te conviennent pas (rm)
  3. Édite celles à ajuster (Edit)
  4. npm run cards:approve hta        # déplace tout pending/ → actif
  5. npm run db:seed                  # pousse sur Neon
```

## Garde-fous

- **JAMAIS** écrire directement dans `content/cards/<topic>/` (sans `pending/`). Le airlock humain est non négociable.
- **JAMAIS** générer sans avoir lu au moins une source dans `sources/`.
- **JAMAIS** inventer une URL de source. Si tu ne l'as pas vérifiée, mets `"version": "à vérifier"` et flag dans le rationale.
- Si tu hésites entre 2 formulations, **propose les deux à l'utilisateur** plutôt que de choisir arbitrairement.

## Référence rapide

| Document | Chemin |
|---|---|
| Schéma Zod (source de vérité) | `lib/schemas.ts` |
| Principes pédagogiques projet | `BLUEPRINT.md` |
| Exemples de cartes existantes | `content/cards/hta/c1-*.json` |
| Sources téléchargées | `sources/<editeur>/<topic>/` |

## Outils Claude Code recommandés pour cette skill

- `Read` (sources + schéma + exemples)
- `Glob` (lister sources et cartes existantes)
- `Write` (créer les fichiers JSON)
- `Bash` pour `ls`, `mkdir -p`
