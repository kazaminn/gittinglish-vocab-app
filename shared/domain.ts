export type ID = string;

// ---------------------------------------------------------------------------
// Grammar (39個)
// ---------------------------------------------------------------------------

export type GrammarPoint =
  // 文型
  | "sv"
  | "svc"
  | "svo"
  | "svoo"
  | "svoc"
  // 時制
  | "present"
  | "past"
  | "present_perfect"
  | "future"
  // 節・句
  | "relative_clause"
  | "relative_adverb"
  | "participle_clause"
  | "noun_clause_that"
  | "noun_clause_wh"
  // 仮定法
  | "subjunctive_present"
  | "subjunctive_past"
  | "subjunctive_past_perfect"
  // 構文
  | "cleft_sentence"
  | "inversion"
  | "comparison"
  | "passive"
  | "causative"
  | "existential_there"
  | "inanimate_subject"
  | "question_exclamation"
  // 準動詞
  | "gerund"
  | "infinitive"
  | "participial_adjective"
  // 品詞・語法
  | "modal"
  | "conjunction"
  | "phrasal_verb"
  | "perception"
  | "article"
  | "preposition"
  // 文法機能
  | "apposition"
  | "ellipsis"
  | "parallelism"
  | "negation"
  // 話法
  | "reported_speech";

export type SupportedGenerationGrammarPoint =
  | "relative_clause"
  | "participle_clause"
  | "subjunctive_past"
  | "noun_clause_that"
  | "cleft_sentence";

// ---------------------------------------------------------------------------
// DrillMode (Phase を置換)
// ---------------------------------------------------------------------------

export type DrillMode =
  | "word_to_meaning"
  | "meaning_to_word"
  | "word_input"
  | "sentence_cloze"
  | "sentence_input"
  | "reorder"
  | "flashcard";

export type DatasetId = "gitverbs85";

// ---------------------------------------------------------------------------
// Tags (multi-axis)
// ---------------------------------------------------------------------------

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "preposition"
  | "conjunction";

export interface VocabularyTag {
  lemma: string;
  pos?: PartOfSpeech;
  frequency?: number;
  meaning?: string;
  target?: boolean;
  category?: string;
}

export type PhraseType_Tag =
  | "collocation"
  | "idiom"
  | "phrasal_verb"
  | "compound";

export interface PhraseTag {
  text: string;
  type?: PhraseType_Tag;
}

export interface ProblemTags {
  grammar: GrammarPoint[];
  vocabulary?: VocabularyTag[];
  phrases?: PhraseTag[];
}

// ---------------------------------------------------------------------------
// Problem taxonomy
// ---------------------------------------------------------------------------

export type PedagogicalKind =
  | "cloze"
  | "reorder"
  | "split"
  | "merge"
  | "error_correction"
  | "paraphrase"
  | "grammar_label"
  | "translation";

export type InteractionType =
  | "select"
  | "input"
  | "reorder"
  | "transform"
  | "identify";

// ---------------------------------------------------------------------------
// AST
// ---------------------------------------------------------------------------

export interface Span {
  start: number;
  end: number;
}

export interface TokenNode {
  id: ID;
  text: string;
  span: Span;
  lemma?: string;
  pos?: string;
  features?: Record<string, string>;
}

export type PhraseType =
  | "subject"
  | "verb"
  | "object"
  | "complement"
  | "modifier"
  | "relative_pronoun"
  | "subordinator"
  | "focus";

export interface PhraseNode {
  id: ID;
  type: PhraseType;
  text: string;
  span: Span;
  tokens: TokenNode[];
}

export type ClauseType =
  | "main"
  | "relative"
  | "participle"
  | "if_clause"
  | "result_clause"
  | "noun_clause"
  | "cleft_focus"
  | "cleft_tail";

export interface ClauseNode {
  id: ID;
  type: ClauseType;
  text: string;
  span: Span;
  phrases: PhraseNode[];
}

export type AstNodeKind = "token" | "phrase" | "clause";

export type RelationType =
  | "modifies"
  | "refers_to"
  | "shares_subject_with"
  | "conditions"
  | "focuses_on";

export interface RelationEdge {
  id: ID;
  type: RelationType;
  from: ID;
  fromKind: AstNodeKind;
  to: ID;
  toKind: AstNodeKind;
}

export interface SentenceAst {
  id: ID;
  originalText: string;
  grammarPoints: GrammarPoint[];
  vocabulary?: VocabularyTag[];
  phrases?: PhraseTag[];
  clauses: ClauseNode[];
  relations: RelationEdge[];
  metadata?: {
    sourceJa?: string;
    difficultyBase?: number;
  };
}

// ---------------------------------------------------------------------------
// Answer / Choice
// ---------------------------------------------------------------------------

export type AnswerJudgeType =
  | "exact"
  | "normalized"
  | "unordered"
  | "partial"
  | "contains";

export interface AnswerSpec {
  judgeType: AnswerJudgeType;
  answers: string[];
  caseSensitive?: boolean;
  trimWhitespace?: boolean;
  ignorePunctuation?: boolean;
}

export interface Choice {
  id: ID;
  text: string;
}

export interface ChoiceAnswerSpec {
  mode: "single" | "multiple";
  correctChoiceIds: ID[];
}

export interface Constraint {
  type: "must_use" | "forbid" | "structure";
  value: string;
}

// ---------------------------------------------------------------------------
// Explanation / Difficulty
// ---------------------------------------------------------------------------

export interface Explanation {
  summary: string;
  details?: string[];
  relatedGrammar?: GrammarPoint[];
}

export interface DifficultyFactors {
  clauseCount?: number;
  transformDepth?: number;
  distractorSimilarity?: number;
  grammarCount?: number;
  rareWordCount?: number;
  structureComplexity?: number;
}

export interface Difficulty {
  level: 1 | 2 | 3 | 4 | 5;
  factors?: DifficultyFactors;
}

// ---------------------------------------------------------------------------
// Problem types (discriminated union)
// ---------------------------------------------------------------------------

export interface BaseProblem {
  id: ID;
  sentenceId: ID;
  sourceAstId?: ID;
  sourceNodeIds?: ID[];

  pedagogicalKind: PedagogicalKind;
  interactionType: InteractionType;
  drillMode: DrillMode;

  tags: ProblemTags;
  prompt: string;
  explanation: Explanation;
  difficulty: Difficulty;
}

export interface ClozeMcqProblem extends BaseProblem {
  pedagogicalKind: "cloze";
  interactionType: "select";
  stem: string;
  choices: Choice[];
  choiceAnswerSpec: ChoiceAnswerSpec;
}

export interface ClozeInputProblem extends BaseProblem {
  pedagogicalKind: "cloze";
  interactionType: "input";
  stem: string;
  answerSpec: AnswerSpec;
}

export interface ReorderChunk {
  id: ID;
  text: string;
}

export interface ReorderProblem extends BaseProblem {
  pedagogicalKind: "reorder";
  interactionType: "reorder";
  chunks: ReorderChunk[];
  correctOrder: ID[];
}

export interface SplitProblem extends BaseProblem {
  pedagogicalKind: "split";
  interactionType: "transform";
  stem: string;
  answerSpec: AnswerSpec;
}

export interface MergeProblem extends BaseProblem {
  pedagogicalKind: "merge";
  interactionType: "transform";
  inputs: string[];
  answerSpec: AnswerSpec;
}

export interface ErrorCorrection {
  span: Span;
  replacement: string;
}

export interface ErrorCorrectionProblem extends BaseProblem {
  pedagogicalKind: "error_correction";
  interactionType: "identify";
  stem: string;
  corrections: ErrorCorrection[];
}

export interface ParaphraseProblem extends BaseProblem {
  pedagogicalKind: "paraphrase";
  interactionType: "transform";
  stem: string;
  answerSpec: AnswerSpec;
}

export interface GrammarLabelProblem extends BaseProblem {
  pedagogicalKind: "grammar_label";
  interactionType: "select";
  stem: string;
  choices: Choice[];
  choiceAnswerSpec: ChoiceAnswerSpec;
}

export interface TranslationProblem extends BaseProblem {
  pedagogicalKind: "translation";
  interactionType: "input";
  sourceJa: string;
  constraints?: Constraint[];
  answerSpec: AnswerSpec;
}

export type GeneratedProblem =
  | ClozeMcqProblem
  | ClozeInputProblem
  | ReorderProblem
  | SplitProblem
  | MergeProblem
  | ErrorCorrectionProblem
  | ParaphraseProblem
  | GrammarLabelProblem
  | TranslationProblem;

// ---------------------------------------------------------------------------
// Generation trace / rule / pipeline
// ---------------------------------------------------------------------------

export type TransformType =
  | "split"
  | "merge"
  | "rewrite"
  | "mask"
  | "inject_error"
  | "reorder";

export interface GeneratedTrace {
  ruleId: ID;
  transformType: TransformType;
  sourceNodeIds: ID[];
}

export interface GeneratedResult {
  trace: GeneratedTrace;
  problems: GeneratedProblem[];
}

export interface RuleSpec {
  id: ID;
  grammarPoint: SupportedGenerationGrammarPoint;
  supportedPedagogicalKinds: PedagogicalKind[];
}

export interface RawSentenceRecord {
  id: ID;
  originalText: string;
  sourceJa?: string;
  grammarPoints: GrammarPoint[];
  vocabulary?: VocabularyTag[];
  phrases?: PhraseTag[];
  annotations?: unknown;
}

// ---------------------------------------------------------------------------
// Session & Drill (MVP)
// ---------------------------------------------------------------------------

export type SessionStatus = "active" | "completed";
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SessionItem {
  problemId: string;
  answered: boolean;
  isCorrect?: boolean;
  answeredAt?: number;
}

export interface Session {
  id: string;
  userId: string;
  drillMode: DrillMode;
  items: SessionItem[];
  currentIndex: number;
  status: SessionStatus;
  startedAt: number;
  completedAt?: number;
}

export interface DrillProgress {
  userId: string;
  itemId: string;
  drillMode: DrillMode;
  ease: number;
  interval: number;
  nextReview: number;
  reps: number;
  updatedAt: number;
}

export interface UserSettings {
  displayName: string;
  fontSize: number;
  fontWeight: number;
  theme: "light" | "dark" | "system";
  sessionSize: number;
}

// ---------------------------------------------------------------------------
// Client-side session (IndexedDB / localStorage)
// ---------------------------------------------------------------------------

export interface LocalAnswer {
  itemId: string;
  drillMode: DrillMode;
  answer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: Explanation;
  answeredAt: number;
}

export interface LocalSettings {
  displayName: string;
  fontSize: number;
  fontWeight: number;
  theme: "light" | "dark" | "system";
  sessionSize: number;
}
