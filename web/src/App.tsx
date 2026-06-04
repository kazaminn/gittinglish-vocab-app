import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import {
  type DatasetId,
  type DrillMode,
  type GeneratedProblem,
} from '@shared/domain';
import { Layout } from './components/Layout';
import { ShellSkeleton } from './components/ShellSkeleton';
import {
  getAvailableModesForDataset,
  getDatasetOptions,
  getDefaultModeForDataset,
  preloadDatasetMode,
  type ProblemSection,
} from './data/problems';
import { LoginPage } from './features/auth/LoginPage';
import { SignupPage } from './features/auth/SignupPage';
import {
  useHomeProblemsQuery,
  useHomeSectionsQuery,
  useSectionLabelQuery,
} from './features/home/queries';
import { LandingPage } from './features/landing/LandingPage';
import { PrivacyPage } from './features/legal/PrivacyPage';
import { TermsPage } from './features/legal/TermsPage';
import { useUserStatsQuery } from './features/user/queries';
import { useAuth } from './hooks/useAuth';
import { useDrill } from './hooks/useDrill';

const EMPTY_PROBLEMS: GeneratedProblem[] = [];
const EMPTY_SECTIONS: ProblemSection[] = [];
const PREVIEW_LIMIT = 5;

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
const loadHomePage = () => import('./features/home/HomePage');
const HomePage = lazy(() =>
  loadHomePage().then((module) => ({
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

  // Once the user is known, warm the Home chunk and the default dataset so
  // they download alongside the shell instead of after it mounts.
  useEffect(() => {
    if (!user) return;
    void loadHomePage();
    void preloadDatasetMode('gitverbs85', 'word_to_meaning');
  }, [user]);

  if (isLoading) return <ShellSkeleton />;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const { isLoading, user } = useAuth();
  if (isLoading) return <ShellSkeleton />;
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
  sections: ProblemSection[]
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

  const sectionsQuery = useHomeSectionsQuery(selection.datasetId);
  const problemsQuery = useHomeProblemsQuery(problemQuery);
  const sectionLabelQuery = useSectionLabelQuery(
    selection.datasetId,
    selection.sectionId
  );

  const sections = sectionsQuery.data ?? EMPTY_SECTIONS;
  const currentProblems = problemsQuery.data ?? EMPTY_PROBLEMS;

  useEffect(() => {
    if (drill.isSessionComplete) {
      void navigate('/app/summary');
    }
  }, [drill.isSessionComplete, navigate]);

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
            problemCount={currentProblems.length}
            previewProblems={currentProblems.slice(0, PREVIEW_LIMIT)}
            isProblemsLoading={problemsQuery.isPending}
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
              sectionLabel={sectionLabelQuery.data}
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
      <Suspense fallback={<ShellSkeleton />}>
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
