import { Navigate, Route, Routes } from "react-router-dom";
import { auth } from "./lib/auth";
import { LoginPage } from "./features/auth/LoginPage";
import { AppShell } from "./components/layout/AppShell";
import { BoardView } from "./features/board/BoardView";
import { ListView } from "./features/list/ListView";
import { CalendarView } from "./features/calendar/CalendarView";
import { GanttView } from "./features/gantt/GanttView";
import { HomeView } from "./features/home/HomeView";
import { ProjectsPage } from "./features/projects/ProjectsPage";
import { PortfoliosPage } from "./features/projects/PortfoliosPage";
import { GoalsPage } from "./features/goals/GoalsPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return auth.isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell>
              <HomeView />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <AppShell>
              <ProjectsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/goals"
        element={
          <ProtectedRoute>
            <AppShell>
              <GoalsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/portfolios"
        element={
          <ProtectedRoute>
            <AppShell>
              <PortfoliosPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/list"
        element={
          <ProtectedRoute>
            <AppShell>
              <ListView />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/calendar"
        element={
          <ProtectedRoute>
            <AppShell>
              <CalendarView />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/timeline"
        element={
          <ProtectedRoute>
            <AppShell>
              <GanttView />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/board"
        element={
          <ProtectedRoute>
            <AppShell>
              <BoardView />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
