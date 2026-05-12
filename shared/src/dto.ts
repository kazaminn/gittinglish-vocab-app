import type {
  Choice,
  ChoiceAnswerSpec,
  Constraint,
  DatasetId,
  Difficulty,
  DrillMode,
  Explanation,
  GeneratedProblem,
  ID,
  InteractionType,
  PedagogicalKind,
  ProblemTags,
  Quality,
} from './domain';

// ---------------------------------------------------------------------------
// DTO types
// ---------------------------------------------------------------------------

export interface BaseProblemDTO {
  id: ID;
  pedagogicalKind: PedagogicalKind;
  interactionType: InteractionType;
  drillMode: DrillMode;
  tags: ProblemTags;
  prompt: string;
  explanation: Explanation;
  difficulty: Difficulty;
}

export interface ClozeMcqProblemDTO extends BaseProblemDTO {
  pedagogicalKind: 'cloze';
  interactionType: 'select';
  payload: {
    stem: string;
    choices: Choice[];
    choiceAnswerSpec: Pick<ChoiceAnswerSpec, 'mode'>;
  };
}

export interface ClozeInputProblemDTO extends BaseProblemDTO {
  pedagogicalKind: 'cloze';
  interactionType: 'input';
  payload: {
    stem: string;
  };
}

export interface ReorderProblemDTO extends BaseProblemDTO {
  pedagogicalKind: 'reorder';
  interactionType: 'reorder';
  payload: {
    chunks: {
      id: ID;
      text: string;
    }[];
  };
}

export interface SplitProblemDTO extends BaseProblemDTO {
  pedagogicalKind: 'split';
  interactionType: 'transform';
  payload: {
    stem: string;
  };
}

export interface MergeProblemDTO extends BaseProblemDTO {
  pedagogicalKind: 'merge';
  interactionType: 'transform';
  payload: {
    inputs: string[];
  };
}

export interface ErrorCorrectionProblemDTO extends BaseProblemDTO {
  pedagogicalKind: 'error_correction';
  interactionType: 'identify';
  payload: {
    stem: string;
  };
}

export interface ParaphraseProblemDTO extends BaseProblemDTO {
  pedagogicalKind: 'paraphrase';
  interactionType: 'transform';
  payload: {
    stem: string;
  };
}

export interface GrammarLabelProblemDTO extends BaseProblemDTO {
  pedagogicalKind: 'grammar_label';
  interactionType: 'select';
  payload: {
    stem: string;
    choices: Choice[];
    choiceAnswerSpec: Pick<ChoiceAnswerSpec, 'mode'>;
  };
}

export interface TranslationProblemDTO extends BaseProblemDTO {
  pedagogicalKind: 'translation';
  interactionType: 'input';
  payload: {
    sourceJa: string;
    constraints?: Constraint[];
  };
}

export type ProblemDTO =
  | ClozeMcqProblemDTO
  | ClozeInputProblemDTO
  | ReorderProblemDTO
  | SplitProblemDTO
  | MergeProblemDTO
  | ErrorCorrectionProblemDTO
  | ParaphraseProblemDTO
  | GrammarLabelProblemDTO
  | TranslationProblemDTO;

// ---------------------------------------------------------------------------
// API envelope
// ---------------------------------------------------------------------------

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

// ---------------------------------------------------------------------------
// API request / response types
// ---------------------------------------------------------------------------

// POST /api/sessions/start
export interface SessionStartRequest {
  dataset: DatasetId;
  drillMode: Exclude<DrillMode, 'flashcard'>;
  sectionId?: string;
  count: number;
}

export interface SessionStartItem {
  itemId: string;
  drillMode: DrillMode;
  problemDTO: ProblemDTO;
  judgeMeta?:
    | {
        kind: 'select';
        correctChoiceIds: string[];
        correctAnswer: string;
      }
    | {
        kind: 'input';
        acceptedAnswers: string[];
        correctAnswer: string;
      };
  currentProgress: {
    ease: number;
    interval: number;
    reps: number;
  };
}

export interface SessionStartResponse {
  sessionId: string;
  startedAt: number;
  items: SessionStartItem[];
}

// POST /api/answers/judge
export interface JudgeRequest {
  itemId: string;
  drillMode: DrillMode;
  answer: string;
}

export interface JudgeResponse {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: Explanation;
}

// POST /api/sessions/end
export interface EndSessionAnswerRequest {
  itemId: string;
  drillMode: DrillMode;
  answer: string;
  answeredAt: number;
}

export interface EndSessionRequest {
  sessionId: string;
  startedAt: number;
  completedAt: number;
  answers: EndSessionAnswerRequest[];
}

export interface EndSessionResultItem {
  itemId: string;
  drillMode: DrillMode;
  isCorrect: boolean;
  quality: Quality;
}

export interface EndSessionResponse {
  accepted: number;
  results: EndSessionResultItem[];
}

// GET /api/users/me/stats
export interface UserStatsResponse {
  totalReviewed: number;
  totalCorrect: number;
  streakDays: number;
  dueToday: number;
}

// ---------------------------------------------------------------------------
// Converter
// ---------------------------------------------------------------------------

export function toProblemDTO(problem: GeneratedProblem): ProblemDTO {
  const base = {
    id: problem.id,
    pedagogicalKind: problem.pedagogicalKind,
    interactionType: problem.interactionType,
    drillMode: problem.drillMode,
    tags: problem.tags,
    prompt: problem.prompt,
    explanation: problem.explanation,
    difficulty: problem.difficulty,
  } satisfies BaseProblemDTO;

  switch (problem.pedagogicalKind) {
    case 'cloze':
      if (problem.interactionType === 'select') {
        return {
          ...base,
          pedagogicalKind: 'cloze',
          interactionType: 'select',
          payload: {
            stem: problem.stem,
            choices: problem.choices,
            choiceAnswerSpec: {
              mode: problem.choiceAnswerSpec.mode,
            },
          },
        };
      }

      return {
        ...base,
        pedagogicalKind: 'cloze',
        interactionType: 'input',
        payload: {
          stem: problem.stem,
        },
      };

    case 'reorder':
      return {
        ...base,
        pedagogicalKind: 'reorder',
        interactionType: 'reorder',
        payload: {
          chunks: problem.chunks,
        },
      };

    case 'split':
      return {
        ...base,
        pedagogicalKind: 'split',
        interactionType: 'transform',
        payload: {
          stem: problem.stem,
        },
      };

    case 'merge':
      return {
        ...base,
        pedagogicalKind: 'merge',
        interactionType: 'transform',
        payload: {
          inputs: problem.inputs,
        },
      };

    case 'error_correction':
      return {
        ...base,
        pedagogicalKind: 'error_correction',
        interactionType: 'identify',
        payload: {
          stem: problem.stem,
        },
      };

    case 'paraphrase':
      return {
        ...base,
        pedagogicalKind: 'paraphrase',
        interactionType: 'transform',
        payload: {
          stem: problem.stem,
        },
      };

    case 'grammar_label':
      return {
        ...base,
        pedagogicalKind: 'grammar_label',
        interactionType: 'select',
        payload: {
          stem: problem.stem,
          choices: problem.choices,
          choiceAnswerSpec: {
            mode: problem.choiceAnswerSpec.mode,
          },
        },
      };

    case 'translation':
      return {
        ...base,
        pedagogicalKind: 'translation',
        interactionType: 'input',
        payload: {
          sourceJa: problem.sourceJa,
          constraints: problem.constraints,
        },
      };

    default: {
      const _exhaustive: never = problem;
      return _exhaustive;
    }
  }
}
