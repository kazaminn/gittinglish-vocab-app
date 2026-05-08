import { useCallback, useMemo, useState } from 'react';
import type { DrillMode, DatasetId, Explanation } from '@shared/domain';
import type { ProblemDTO, SessionStartItem } from '@shared/dto';
import { judgeOnClient } from '@shared/logic/judge';
import {
  useEndSessionMutation,
  useStartSessionMutation,
} from '../features/drill/queries';
import { useAuth } from './useAuth';

export interface AnswerResult {
  problemId: string;
  drillMode: DrillMode;
  isCorrect: boolean;
  userAnswer: string;
  submittedAnswer: string;
  correctAnswer: string;
  prompt: string;
  stem: string;
  explanation: string;
  answeredAt: number;
}

export interface DrillState {
  isActive: boolean;
  isBusy: boolean;
  currentItem: SessionStartItem | undefined;
  currentProblem: ProblemDTO | undefined;
  currentIndex: number;
  totalCount: number;
  lastAnswer: AnswerResult | undefined;
  isSessionComplete: boolean;
  results: AnswerResult[];
  correctCount: number;
}

export interface DrillActions {
  startSession: (
    dataset: DatasetId,
    drillMode: Exclude<DrillMode, 'flashcard'>,
    sessionSize: number,
    sectionId?: string
  ) => Promise<void>;
  answer: (userInput: string) => Promise<AnswerResult>;
  next: () => Promise<void>;
  endSession: (persistProgress?: boolean) => Promise<void>;
}

function getStem(problem: ProblemDTO): string {
  if ('stem' in problem.payload) return problem.payload.stem;
  if ('chunks' in problem.payload) {
    return problem.payload.chunks.map((chunk) => chunk.text).join(' / ');
  }
  if ('inputs' in problem.payload) {
    return problem.payload.inputs.join(' / ');
  }
  if ('sourceJa' in problem.payload) {
    return problem.payload.sourceJa;
  }

  return '';
}

function getExplanationText(explanation: Explanation): string {
  return explanation.details?.[0] ?? explanation.summary;
}

function getDisplayedUserAnswer(problem: ProblemDTO, userInput: string): string {
  if ('choices' in problem.payload) {
    return (
      problem.payload.choices.find((choice) => choice.id === userInput)?.text ??
      userInput
    );
  }

  if ('chunks' in problem.payload) {
    const chunkMap = new Map(
      problem.payload.chunks.map((chunk) => [chunk.id, chunk.text])
    );
    return userInput
      .split(',')
      .map((chunkId) => chunkMap.get(chunkId.trim()) ?? '')
      .filter(Boolean)
      .join(' ');
  }

  return userInput;
}

function toEndSessionAnswer(result: AnswerResult) {
  return {
    itemId: result.problemId,
    drillMode: result.drillMode,
    answer: result.submittedAnswer,
    answeredAt: result.answeredAt,
  };
}

export function useDrill(): DrillState & DrillActions {
  const { user } = useAuth();
  const startSessionMutation = useStartSessionMutation();
  const endSessionMutation = useEndSessionMutation();
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [startedAt, setStartedAt] = useState<number | undefined>();
  const [items, setItems] = useState<SessionStartItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastAnswer, setLastAnswer] = useState<AnswerResult | undefined>();
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  const currentItem = items[currentIndex];
  const currentProblem = currentItem?.problemDTO;

  const persistSessionResults = useCallback(
    async (pendingResults: AnswerResult[]) => {
      if (!sessionId || !startedAt || pendingResults.length === 0) return;

      await endSessionMutation.mutateAsync({
        sessionId,
        startedAt,
        completedAt: Date.now(),
        answers: pendingResults.map(toEndSessionAnswer),
      });
    },
    [endSessionMutation, sessionId, startedAt]
  );

  const resetState = useCallback(() => {
    setSessionId(undefined);
    setStartedAt(undefined);
    setItems([]);
    setCurrentIndex(0);
    setLastAnswer(undefined);
    setResults([]);
    setIsSessionComplete(false);
  }, []);

  const startSession = useCallback(
    async (
      dataset: DatasetId,
      drillMode: Exclude<DrillMode, 'flashcard'>,
      sessionSize: number,
      sectionId?: string
    ) => {
      const response = await startSessionMutation.mutateAsync({
        dataset,
        drillMode,
        sectionId,
        count: sessionSize,
      });

      setSessionId(response.sessionId);
      setStartedAt(response.startedAt);
      setItems(response.items);
      setCurrentIndex(0);
      setLastAnswer(undefined);
      setResults([]);
      setIsSessionComplete(false);
    },
    [startSessionMutation]
  );

  const answer = useCallback(
    async (userInput: string): Promise<AnswerResult> => {
      if (!currentProblem || !currentItem) {
        throw new Error('No current problem');
      }

      const judge = judgeOnClient(currentItem, userInput);

      const result: AnswerResult = {
        problemId: currentItem.itemId,
        drillMode: currentItem.drillMode,
        isCorrect: judge.isCorrect,
        userAnswer: getDisplayedUserAnswer(currentProblem, userInput),
        submittedAnswer: userInput,
        correctAnswer: judge.correctAnswer,
        prompt: currentProblem.prompt,
        stem: getStem(currentProblem),
        explanation: getExplanationText(judge.explanation),
        answeredAt: Date.now(),
      };

      setLastAnswer(result);
      setResults((previous) => [...previous, result]);
      return result;
    },
    [currentItem, currentProblem]
  );

  const next = useCallback(async () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= items.length) {
      setIsSessionComplete(true);
      setLastAnswer(undefined);
      // Persist in the background so the summary screen renders immediately.
      // The server is the source of truth for SM-2 / progress; failures are
      // logged but do not block navigation.
      void persistSessionResults(results).catch((error) => {
        console.error('Failed to persist session results', error);
      });
      return;
    }

    setCurrentIndex(nextIndex);
    setLastAnswer(undefined);
  }, [currentIndex, items.length, persistSessionResults, results]);

  const endSession = useCallback(
    async (persistProgress = false) => {
      // next() already persists when the last item is answered. Persisting
      // again on completion returns 409 (session already ended) and breaks
      // navigation if the caller awaits it.
      if (persistProgress && !isSessionComplete) {
        await persistSessionResults(results);
      }

      resetState();
    },
    [isSessionComplete, persistSessionResults, resetState, results]
  );

  const isBusy = useMemo(
    () => startSessionMutation.isPending || endSessionMutation.isPending,
    [endSessionMutation.isPending, startSessionMutation.isPending]
  );

  return {
    isActive: Boolean(user && sessionId && currentProblem && !isSessionComplete),
    isBusy,
    currentItem,
    currentProblem,
    currentIndex,
    totalCount: items.length,
    lastAnswer,
    isSessionComplete,
    results,
    correctCount: results.filter((result) => result.isCorrect).length,
    startSession,
    answer,
    next,
    endSession,
  };
}
