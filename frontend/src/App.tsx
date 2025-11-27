import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ShellLayout } from './layouts/ShellLayout';
import ScheduleBuilderPage from './features/schedule-builder/ScheduleBuilderPage';

import LuminanceAnalysisPage from './features/luminance-analysis/LuminanceAnalysisPage';

const Dashboard = () => (
  <div className="p-8 text-slate-300">
    <h2 className="text-3xl font-bold text-slate-100 mb-4">Welcome to LDP</h2>
    <p className="max-w-2xl">
      Select a tool from the sidebar to get started. The Unified Lighting Design Platform integrates your essential workflows into one cohesive system.
    </p>
  </div>
);

import { ProjectProvider } from './context/ProjectContext';

function App() {
  return (
    <ProjectProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ShellLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="schedule-builder" element={<ScheduleBuilderPage />} />
            <Route path="luminance-analysis" element={<LuminanceAnalysisPage />} />
          </Route>
        </Routes>
      </Router>
    </ProjectProvider>
  );
}

export default App;
