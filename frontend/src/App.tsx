import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ShellLayout } from './layouts/ShellLayout';
import ScheduleBuilderPage from './features/schedule-builder/ScheduleBuilderPage';

import LuminanceAnalysisPage from './features/luminance-analysis/LuminanceAnalysisPage';

import Dashboard from './pages/Dashboard';

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
