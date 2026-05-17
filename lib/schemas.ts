import { z } from "zod";

export const SourceSchema = z.object({
  kind: z.enum(["HAS", "CNGE", "NICE", "Pilly", "ebmfrance", "LiSA", "ESC", "other"]),
  url: z.string().url(),
  version: z.string().min(1),
  note: z.string().optional(),
});
export type Source = z.infer<typeof SourceSchema>;

export const CardKindSchema = z.enum(["lesson", "cloze", "qcm-vignette", "free-recall", "sct"]);
export type CardKind = z.infer<typeof CardKindSchema>;

export const CardTagsSchema = z.object({
  system: z.array(z.string()).default([]),
  sdd: z.array(z.string()).default([]),
  item_edn: z.array(z.number().int().positive()).default([]),
  cnge_family: z.array(z.string()).default([]),
});
export type CardTags = z.infer<typeof CardTagsSchema>;

export const QcmChoiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  correct: z.boolean(),
});

// Schéma visuel optionnel attaché à une carte (typiquement une lesson).
// - "image" : URL externe (Wikipedia Commons recommandé, hotlink OK pour usage perso).
// - "ascii" : représentation textuelle inline, rendue en <pre>.
// - "diagram" : URL externe d'un schéma/diagramme didactique (mêmes contraintes que image).
export const MediaSchema = z.object({
  kind: z.enum(["image", "ascii", "diagram"]),
  src: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string().optional(),
  attribution: z.string().optional(),
});
export type Media = z.infer<typeof MediaSchema>;

const CardCommon = {
  id: z.string().min(1),
  prompt: z.string().min(1),
  rationale: z.string().min(1),
  tags: CardTagsSchema,
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  source: SourceSchema,
  illness_script_id: z.string().nullable().optional(),
  media: z.array(MediaSchema).optional(),
  status: z.enum(["active", "pending-review", "retired"]).default("active"),
};

export const LessonCardSchema = z.object({
  ...CardCommon,
  kind: z.literal("lesson"),
});

export const ClozeCardSchema = z.object({
  ...CardCommon,
  kind: z.literal("cloze"),
  expected: z.array(z.string().min(1)).min(1),
});

export const QcmCardSchema = z.object({
  ...CardCommon,
  kind: z.literal("qcm-vignette"),
  choices: z.array(QcmChoiceSchema).min(2),
  expected: z.array(z.string().min(1)).min(1),
});

export const FreeRecallCardSchema = z.object({
  ...CardCommon,
  kind: z.literal("free-recall"),
  expected: z.array(z.string().min(1)).min(1),
});

export const SctCardSchema = z.object({
  ...CardCommon,
  kind: z.literal("sct"),
  hypothesis: z.string().min(1),
  new_info: z.string().min(1),
  expected: z.enum(["renforce", "affaiblit", "neutre"]),
});

export const CardSchema = z.discriminatedUnion("kind", [
  LessonCardSchema,
  ClozeCardSchema,
  QcmCardSchema,
  FreeRecallCardSchema,
  SctCardSchema,
]);
export type Card = z.infer<typeof CardSchema>;

export const IllnessScriptSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  icd10: z.string().optional(),
  predisposing: z.array(z.string()),
  pathophysiology: z.string(),
  clinical_features: z.object({
    symptoms: z.array(z.string()),
    signs: z.array(z.string()),
    biology: z.array(z.string()).optional(),
  }),
  typical_course: z.string(),
  discriminators: z.array(z.object({ vs: z.string(), key: z.string() })),
  red_flags: z.array(z.string()),
  workup: z.array(z.string()),
  management: z.object({
    first_line: z.array(z.string()),
    second_line: z.array(z.string()).optional(),
    referral: z.string().optional(),
  }),
  sources: z.array(SourceSchema).min(1),
});
export type IllnessScript = z.infer<typeof IllnessScriptSchema>;

export const TreeNodeSchema: z.ZodType<TreeNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: z.enum(["question", "branch", "outcome", "investigation"]),
    text: z.string(),
    children: z.array(TreeNodeSchema).optional(),
    outcome: z.string().optional(),
  })
);
export type TreeNode = {
  id: string;
  type: "question" | "branch" | "outcome" | "investigation";
  text: string;
  children?: TreeNode[];
  outcome?: string;
};

export const DecisionTreeSchema = z.object({
  id: z.string(),
  trigger: z.string(),
  red_flag_gate: z.array(z.string()),
  nodes: z.array(TreeNodeSchema),
  source: SourceSchema,
});
export type DecisionTree = z.infer<typeof DecisionTreeSchema>;

export const CaseStageSchema = z.object({
  id: z.string(),
  kind: z.enum(["anamnesis", "examination", "investigations", "diagnosis", "management"]),
  prompt: z.string(),
  expected_reasoning: z.string(),
  reveal: z.string(),
});

export const CaseSchema = z.object({
  id: z.string(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  title: z.string(),
  stages: z.array(CaseStageSchema).min(2),
  hidden_diagnosis: z.string(),
  differential: z.array(z.string()),
  illness_script_ref: z.string().optional(),
  family_tags: z.array(z.string()),
  sources: z.array(SourceSchema).min(1),
});
export type Case = z.infer<typeof CaseSchema>;

export const FsrsRating = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

export const SessionMetricsSchema = z.object({
  cards_total: z.number().int().nonnegative(),
  cards_correct: z.number().int().nonnegative(),
  confidence_avg: z.number().nullable(),
  calibration_delta: z.number().nullable(),
  duration_ms: z.number().int().nonnegative(),
});
export type SessionMetrics = z.infer<typeof SessionMetricsSchema>;
