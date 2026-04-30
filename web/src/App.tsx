import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { type DatasetId, type DrillMode } from '@shared/domain';
import { Layout } from './components/Layout';
import {
  getAvailableModesForDataset,
  getDatasetOptions,
  getDefaultModeForDataset,
  getPreviewProblems,
  getProblemCount,
  getProblemsForQuery,
  getSectionLabel,
  getSectionsForDataset,
  preloadDatasetMode,
} from './data/problems';
import { LandingPage } from './features/landing/LandingPage';
import { LoginPage } from './features/auth/LoginPage';
import { SignupPage } from './features/auth/SignupPage';
import { PrivacyPage } from './features/legal/PrivacyPage';
import { TermsPage } from './features/legal/TermsPage';
import { useUserStatsQuery } from './features/user/queries';
import { useAuth } from './hooks/useAuth';
import { useDrill } from './hooks/useDrill';

const DrillPage = lazy(() =>
  import('./features/drill/DrillPage').then((module) => ({
    default: module.DrillPage,
  }))
);
const SummaryPage = lazy(() =>
  import('./features/drill/SummaryPage').then((module) => ({
    default: module.SummaryPage,
  }))
);
const FlashcardPage = lazy(() =>
  import('./features/flashcard/FlashcardPage').then((module) => ({
    default: module.FlashcardPage,
  }))
);
const HomePage = lazy(() =>
  import('./features/home/HomePage').then((module) => ({
    default: module.HomePage,
  }))
);
const SettingsPage = lazy(() =>
  import('./features/settings/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  }))
);

interface AppSelection {
  datasetId: DatasetId;
  drillMode: DrillMode;
  sectionId?: string;
  sessionSize: number;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const { isLoading, user } = useAuth();
  if (isLoading) return null;
  return user ? <Navigate to="/app" replace /> : <LandingPage />;
}

function createDefaultSelection(datasetId: DatasetId): AppSelection {
  return {
    datasetId,
    drillMode: getDefaultModeForDataset(datasetId),
    sessionSize: 20,
  };
}

function normalizeSelection(
  selection: AppSelection,
  sections: Awaited<ReturnType<typeof getSectionsForDataset>>
): AppSelection {
  const availableModes = getAvailableModesForDataset(selection.datasetId);
  const nextMode = availableModes.includes(selection.drillMode)
    ? selection.drillMode
    : getDefaultModeForDataset(selection.datasetId);
  const hasSection =
    selection.sectionId !== undefined &&
    sections.some((section) => section.id === selection.sectionId);

  return {
    ...selection,
    drillMode: nextMode,
    sectionId: hasSection ? selection.sectionId : undefined,
  };
}

function VocabAppShell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const drill = useDrill();
  const statsQuery = useUserStatsQuery(Boolean(user));
  const [sections, setSections] = useState<
    Awaited<ReturnType<typeof getSectionsForDataset>>
  >([]);
  const [previewProblems, setPreviewProblems] = useState<
    Awaited<ReturnType<typeof getPreviewProblems>>
  >([]);
  const [problemCount, setProblemCount] = useState(0);
  const [currentProblems, setCurrentProblems] = useState<
    Awaited<ReturnType<typeof getProblemsForQuery>>
  >([]);
  const [sectionLabel, setSectionLabel] = useState<string | undefined>();
  const [selection, setSelection] = useState<AppSelection>(() =>
    createDefaultSelection('gitverbs85')
  );

  const availableModes = useMemo(
    () => getAvailableModesForDataset(selection.datasetId),
    [selection.datasetId]
  );
  const problemQuery = useMemo(
    () => ({
      datasetId: selection.datasetId,
      drillMode: selection.drillMode,
      sectionId: selection.sectionId,
    }),
    [selection.datasetId, selection.drillMode, selection.sectionId]
  );

  useEffect(() => {
    if (drill.isSessionComplete) {
      void navigate('/app/summary');
    }
  }, [drill.isSessionComplete, navigate]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [nextSections, nextPreviewProblems, nextProblemCount, nextCurrentProblems] =
        await Promise.all([
          getSectionsForDataset(selection.datasetId),
          getPreviewProblems(problemQuery),
          getProblemCount(problemQuery),
          getProblemsForQuery(problemQuery),
        ]);
      if (cancelled) return;
      setSections(nextSections);
      setPreviewProblems(nextPreviewProblems);
      setProblemCount(nextProblemCount);
      setCurrentProblems(nextCurrentProblems);
    })();
    return () => {
      cancelled = true;
    };
  }, [problemQuery, selection.datasetId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const nextSectionLabel = await getSectionLabel(
        selection.datasetId,
        selection.sectionId
      );
      if (!cancelled) {
        setSectionLabel(nextSectionLabel);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selection.datasetId, selection.sectionId]);

  function handleSelectionChange(nextSelection: AppSelection) {
    setSelection(normalizeSelection(nextSelection, sections));
  }

  function handleStartDrill(nextSelection: AppSelection) {
    const normalizedSelection = normalizeSelection(nextSelection, sections);
    setSelection(normalizedSelection);

    void (async () => {
      if (normalizedSelection.drillMode === 'flashcard') {
        await preloadDatasetMode(
          normalizedSelection.datasetId,
          getDefaultFlashcardSourceMode(normalizedSelection.datasetId)
        );
        await navigate('/app/flashcard');
        return;
      }

      const drillMode = normalizedSelection.drillMode;
      await drill.startSession(
        normalizedSelection.datasetId,
        drillMode,
        normalizedSelection.sessionSize,
        normalizedSelection.sectionId
      );
      await navigate('/app/drill');
    })();
  }

  function handleLeaveSession(pathname: string) {
    void (async () => {
      await drill.endSession(true);
      await navigate(pathname);
    })();
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            selection={selection}
            datasetOptions={getDatasetOptions()}
            availableModes={availableModes}
            sections={sections}
            problemCount={problemCount}
            previewProblems={previewProblems}
            stats={statsQuery.data}
            isStatsLoading={statsQuery.isPending}
            statsError={statsQuery.error?.message}
            onSelectionChange={handleSelectionChange}
            onStartDrill={handleStartDrill}
          />
        }
      />
      <Route
        path="drill"
        element={
          drill.isActive && drill.currentProblem && drill.currentItem ? (
            <DrillPage
              item={drill.currentItem}
              currentIndex={drill.currentIndex}
              totalCount={drill.totalCount}
              lastAnswer={drill.lastAnswer}
              onAnswer={drill.answer}
              onNext={drill.next}
              onExitToHome={() => handleLeaveSession('/app')}
            />
          ) : (
            <Navigate to="/app" replace />
          )
        }
      />
      <Route
        path="summary"
        element={
          drill.isSessionComplete ? (
            <SummaryPage
              results={drill.results}
              correctCount={drill.correctCount}
              totalCount={drill.totalCount}
              drillMode={selection.drillMode}
              onBackToHome={() => handleLeaveSession('/app')}
            />
          ) : (
            <Navigate to="/app" replace />
          )
        }
      />
      <Route
        path="flashcard"
        element={
          selection.drillMode === 'flashcard' ? (
            <FlashcardPage
              problems={currentProblems}
              datasetId={selection.datasetId}
              sectionLabel={sectionLabel}
              onBackToHome={() => {
                void navigate('/app');
              }}
            />
          ) : (
            <Navigate to="/app" replace />
          )
        }
      />
      <Route
        path="settings"
        element={
          <SettingsPage
            onBackToHome={() => {
              void navigate('/app');
            }}
          />
        }
      />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Layout>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <VocabAppShell />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;

function getDefaultFlashcardSourceMode(
  _datasetId: DatasetId
): Exclude<DrillMode, 'flashcard'> {
  return 'word_to_meaning';
}
