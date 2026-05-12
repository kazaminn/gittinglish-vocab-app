import { z } from 'zod';

// ---------------------------------------------------------------------------
// Grammar (39個)
// ---------------------------------------------------------------------------

export const GrammarPointSchema = z.enum([
  // 文型
  'sv',
  'svc',
  'svo',
  'svoo',
  'svoc',
  // 時制
  'present',
  'past',
  'present_perfect',
  'future',
  // 節・句
  'relative_clause',
  'relative_adverb',
  'participle_clause',
  'noun_clause_that',
  'noun_clause_wh',
  // 仮定法
  'subjunctive_present',
  'subjunctive_past',
  'subjunctive_past_perfect',
  // 構文
  'cleft_sentence',
  'inversion',
  'comparison',
  'passive',
  'causative',
  'existential_there',
  'inanimate_subject',
  'question_exclamation',
  // 準動詞
  'gerund',
  'infinitive',
  'participial_adjective',
  // 品詞・語法
  'modal',
  'conjunction',
  'phrasal_verb',
  'perception',
  'article',
  'preposition',
  // 文法機能
  'apposition',
  'ellipsis',
  'parallelism',
  'negation',
  // 話法
  'reported_speech',
]);

export const SupportedGenerationGrammarPointSchema = z.enum([
  'relative_clause',
  'participle_clause',
  'subjunctive_past',
  'noun_clause_that',
  'cleft_sentence',
]);

// ---------------------------------------------------------------------------
// DrillMode
// ---------------------------------------------------------------------------

export const DrillModeSchema = z.enum([
  'word_to_meaning',
  'meaning_to_word',
  'word_input',
  'sentence_cloze',
  'sentence_input',
  'reorder',
  'flashcard',
]);

export const DatasetIdSchema = z.enum(['gitverbs85']);

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export const PartOfSpeechSchema = z.enum([
  'noun',
  'verb',
  'adjective',
  'adverb',
  'preposition',
  'conjunction',
]);

export const VocabularyTagSchema = z.object({
  lemma: z.string().min(1),
  pos: PartOfSpeechSchema.optional(),
  frequency: z.number().min(0).optional(),
  meaning: z.string().optional(),
  target: z.boolean().optional(),
  category: z.string().optional(),
});

export const PhraseType_TagSchema = z.enum([
  'collocation',
  'idiom',
  'phrasal_verb',
  'compound',
]);

export const PhraseTagSchema = z.object({
  text: z.string().min(1),
  type: PhraseType_TagSchema.optional(),
});

export const ProblemTagsSchema = z.object({
  grammar: z.array(GrammarPointSchema).min(1).max(3),
  vocabulary: z.array(VocabularyTagSchema).max(5).optional(),
  phrases: z.array(PhraseTagSchema).max(3).optional(),
});

// ---------------------------------------------------------------------------
// Problem taxonomy
// ---------------------------------------------------------------------------

export const PedagogicalKindSchema = z.enum([
  'cloze',
  'reorder',
  'split',
  'merge',
  'error_correction',
  'paraphrase',
  'grammar_label',
  'translation',
]);

export const InteractionTypeSchema = z.enum([
  'select',
  'input',
  'reorder',
  'transform',
  'identify',
]);

// ---------------------------------------------------------------------------
// AST
// ---------------------------------------------------------------------------

export const SpanSchema = z
  .object({
    start: z.number().int().min(0),
    end: z.number().int().min(0),
  })
  .refine((v) => v.end >= v.start, {
    message: 'Span.end must be greater than or equal to Span.start',
  });

export const TokenNodeSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  span: SpanSchema,
  lemma: z.string().optional(),
  pos: z.string().optional(),
  features: z.record(z.string(), z.string()).optional(),
});

export const PhraseTypeSchema = z.enum([
  'subject',
  'verb',
  'object',
  'complement',
  'modifier',
  'relative_pronoun',
  'subordinator',
  'focus',
]);

export const PhraseNodeSchema = z.object({
  id: z.string().min(1),
  type: PhraseTypeSchema,
  text: z.string(),
  span: SpanSchema,
  tokens: z.array(TokenNodeSchema),
});

export const ClauseTypeSchema = z.enum([
  'main',
  'relative',
  'participle',
  'if_clause',
  'result_clause',
  'noun_clause',
  'cleft_focus',
  'cleft_tail',
]);

export const ClauseNodeSchema = z.object({
  id: z.string().min(1),
  type: ClauseTypeSchema,
  text: z.string(),
  span: SpanSchema,
  phrases: z.array(PhraseNodeSchema),
});

export const AstNodeKindSchema = z.enum(['token', 'phrase', 'clause']);

export const RelationTypeSchema = z.enum([
  'modifies',
  'refers_to',
  'shares_subject_with',
  'conditions',
  'focuses_on',
]);

export const RelationEdgeSchema = z.object({
  id: z.string().min(1),
  type: RelationTypeSchema,
  from: z.string().min(1),
  fromKind: AstNodeKindSchema,
  to: z.string().min(1),
  toKind: AstNodeKindSchema,
});

export const SentenceAstSchema = z.object({
  id: z.string().min(1),
  originalText: z.string(),
  grammarPoints: z.array(GrammarPointSchema),
  vocabulary: z.array(VocabularyTagSchema).optional(),
  phrases: z.array(PhraseTagSchema).optional(),
  clauses: z.array(ClauseNodeSchema),
  relations: z.array(RelationEdgeSchema),
  metadata: z
    .object({
      sourceJa: z.string().optional(),
      difficultyBase: z.number().min(0).optional(),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// Answer / Choice
// ---------------------------------------------------------------------------

export const AnswerJudgeTypeSchema = z.enum([
  'exact',
  'normalized',
  'unordered',
  'partial',
  'contains',
]);

export const AnswerSpecSchema = z.object({
  judgeType: AnswerJudgeTypeSchema,
  answers: z.array(z.string()).min(1),
  caseSensitive: z.boolean().optional(),
  trimWhitespace: z.boolean().optional(),
  ignorePunctuation: z.boolean().optional(),
});

export const ChoiceSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
});

export const ChoiceAnswerSpecSchema = z
  .object({
    mode: z.enum(['single', 'multiple']),
    correctChoiceIds: z.array(z.string().min(1)).min(1),
  })
  .superRefine((value, ctx) => {
    if (value.mode === 'single' && value.correctChoiceIds.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'choiceAnswerSpec.mode="single" requires exactly one correctChoiceId',
        path: ['correctChoiceIds'],
      });
    }
  });

export const ConstraintSchema = z.object({
  type: z.enum(['must_use', 'forbid', 'structure']),
  value: z.string(),
});

// ---------------------------------------------------------------------------
// Explanation / Difficulty
// ---------------------------------------------------------------------------

export const ExplanationSchema = z.object({
  summary: z.string(),
  details: z.array(z.string()).optional(),
  relatedGrammar: z.array(GrammarPointSchema).optional(),
});

export const DifficultyFactorsSchema = z.object({
  clauseCount: z.number().min(0).optional(),
  transformDepth: z.number().min(0).optional(),
  distractorSimilarity: z.number().min(0).optional(),
  grammarCount: z.number().min(0).optional(),
  rareWordCount: z.number().min(0).optional(),
  structureComplexity: z.number().min(0).optional(),
});

export const DifficultySchema = z.object({
  level: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  factors: DifficultyFactorsSchema.optional(),
});

// ---------------------------------------------------------------------------
// Problem schemas
// ---------------------------------------------------------------------------

export const BaseProblemSchema = z.object({
  id: z.string().min(1),
  sentenceId: z.string().min(1),
  sourceAstId: z.string().min(1).optional(),
  sourceNodeIds: z.array(z.string().min(1)).optional(),
  pedagogicalKind: PedagogicalKindSchema,
  interactionType: InteractionTypeSchema,
  drillMode: DrillModeSchema,
  tags: ProblemTagsSchema,
  prompt: z.string(),
  explanation: ExplanationSchema,
  difficulty: DifficultySchema,
});

export const ClozeMcqProblemSchema = BaseProblemSchema.extend({
  pedagogicalKind: z.literal('cloze'),
  interactionType: z.literal('select'),
  stem: z.string(),
  choices: z.array(ChoiceSchema).min(2),
  choiceAnswerSpec: ChoiceAnswerSpecSchema,
}).superRefine((value, ctx) => {
  const choiceIds = new Set(value.choices.map((choice) => choice.id));
  for (const choiceId of value.choiceAnswerSpec.correctChoiceIds) {
    if (!choiceIds.has(choiceId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'All correctChoiceIds must exist in choices',
        path: ['choiceAnswerSpec', 'correctChoiceIds'],
      });
      break;
    }
  }
});

export const ClozeInputProblemSchema = BaseProblemSchema.extend({
  pedagogicalKind: z.literal('cloze'),
  interactionType: z.literal('input'),
  stem: z.string(),
  answerSpec: AnswerSpecSchema,
});

export const ReorderChunkSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
});

export const ReorderProblemSchema = BaseProblemSchema.extend({
  pedagogicalKind: z.literal('reorder'),
  interactionType: z.literal('reorder'),
  chunks: z.array(ReorderChunkSchema).min(2),
  correctOrder: z.array(z.string().min(1)).min(2),
}).superRefine((value, ctx) => {
  const chunkIds = value.chunks.map((chunk) => chunk.id);
  const chunkIdSet = new Set(chunkIds);
  const orderSet = new Set(value.correctOrder);

  if (chunkIds.length !== value.correctOrder.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'correctOrder length must equal chunks length',
      path: ['correctOrder'],
    });
  }
  if (orderSet.size !== value.correctOrder.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'correctOrder must not contain duplicates',
      path: ['correctOrder'],
    });
  }
  for (const id of value.correctOrder) {
    if (!chunkIdSet.has(id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'All correctOrder ids must exist in chunks',
        path: ['correctOrder'],
      });
      break;
    }
  }
});

export const SplitProblemSchema = BaseProblemSchema.extend({
  pedagogicalKind: z.literal('split'),
  interactionType: z.literal('transform'),
  stem: z.string(),
  answerSpec: AnswerSpecSchema,
});

export const MergeProblemSchema = BaseProblemSchema.extend({
  pedagogicalKind: z.literal('merge'),
  interactionType: z.literal('transform'),
  inputs: z.array(z.string()).min(2),
  answerSpec: AnswerSpecSchema,
});

export const ErrorCorrectionSchema = z.object({
  span: SpanSchema,
  replacement: z.string(),
});

export const ErrorCorrectionProblemSchema = BaseProblemSchema.extend({
  pedagogicalKind: z.literal('error_correction'),
  interactionType: z.literal('identify'),
  stem: z.string(),
  corrections: z.array(ErrorCorrectionSchema).min(1),
}).superRefine((value, ctx) => {
  for (const [index, correction] of value.corrections.entries()) {
    if (correction.span.end > value.stem.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Correction span must be within stem bounds',
        path: ['corrections', index, 'span'],
      });
    }
  }
});

export const ParaphraseProblemSchema = BaseProblemSchema.extend({
  pedagogicalKind: z.literal('paraphrase'),
  interactionType: z.literal('transform'),
  stem: z.string(),
  answerSpec: AnswerSpecSchema,
});

export const GrammarLabelProblemSchema = BaseProblemSchema.extend({
  pedagogicalKind: z.literal('grammar_label'),
  interactionType: z.literal('select'),
  stem: z.string(),
  choices: z.array(ChoiceSchema).min(2),
  choiceAnswerSpec: ChoiceAnswerSpecSchema,
}).superRefine((value, ctx) => {
  const choiceIds = new Set(value.choices.map((choice) => choice.id));
  for (const choiceId of value.choiceAnswerSpec.correctChoiceIds) {
    if (!choiceIds.has(choiceId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'All correctChoiceIds must exist in choices',
        path: ['choiceAnswerSpec', 'correctChoiceIds'],
      });
      break;
    }
  }
});

export const TranslationProblemSchema = BaseProblemSchema.extend({
  pedagogicalKind: z.literal('translation'),
  interactionType: z.literal('input'),
  sourceJa: z.string(),
  constraints: z.array(ConstraintSchema).optional(),
  answerSpec: AnswerSpecSchema,
});

export const GeneratedProblemSchema = z.discriminatedUnion('pedagogicalKind', [
  ClozeMcqProblemSchema,
  ClozeInputProblemSchema,
  ReorderProblemSchema,
  SplitProblemSchema,
  MergeProblemSchema,
  ErrorCorrectionProblemSchema,
  ParaphraseProblemSchema,
  GrammarLabelProblemSchema,
  TranslationProblemSchema,
]);

// ---------------------------------------------------------------------------
// Generation trace / rule
// ---------------------------------------------------------------------------

export const TransformTypeSchema = z.enum([
  'split',
  'merge',
  'rewrite',
  'mask',
  'inject_error',
  'reorder',
]);

export const GeneratedTraceSchema = z.object({
  ruleId: z.string().min(1),
  transformType: TransformTypeSchema,
  sourceNodeIds: z.array(z.string().min(1)),
});

export const GeneratedResultSchema = z.object({
  trace: GeneratedTraceSchema,
  problems: z.array(GeneratedProblemSchema),
});

export const RuleSpecSchema = z.object({
  id: z.string().min(1),
  grammarPoint: SupportedGenerationGrammarPointSchema,
  supportedPedagogicalKinds: z.array(PedagogicalKindSchema).min(1),
});

export const RawSentenceRecordSchema = z.object({
  id: z.string().min(1),
  originalText: z.string(),
  sourceJa: z.string().optional(),
  grammarPoints: z.array(GrammarPointSchema).min(1),
  vocabulary: z.array(VocabularyTagSchema).optional(),
  phrases: z.array(PhraseTagSchema).optional(),
  annotations: z.unknown().optional(),
});

// ---------------------------------------------------------------------------
// API request / response
// ---------------------------------------------------------------------------

const NonFlashcardDrillModeSchema = z.enum([
  'word_to_meaning',
  'meaning_to_word',
  'word_input',
  'sentence_cloze',
  'sentence_input',
  'reorder',
]);

export const SessionStartRequestSchema = z.object({
  dataset: DatasetIdSchema,
  drillMode: NonFlashcardDrillModeSchema,
  sectionId: z.string().min(1).optional(),
  count: z.number().int().min(1).max(50),
});

export const JudgeRequestSchema = z.object({
  itemId: z.string().min(1),
  drillMode: DrillModeSchema,
  answer: z.string(),
});

export const EndSessionAnswerRequestSchema = z.object({
  itemId: z.string().min(1),
  drillMode: DrillModeSchema,
  answer: z.string(),
  answeredAt: z.number().int().positive(),
});

export const EndSessionRequestSchema = z.object({
  sessionId: z.string().min(1),
  startedAt: z.number().int().positive(),
  completedAt: z.number().int().positive(),
  answers: z.array(EndSessionAnswerRequestSchema).max(100),
});
