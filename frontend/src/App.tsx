import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ShellLayout } from './layouts/ShellLayout';
import ScheduleBuilderPage from './features/schedule-builder/ScheduleBuilderPage';
import ChangeNarrativePage from './tools/change-narrative/ChangeNarrativePage';
import LuminanceAnalysisPage from './features/luminance-analysis/LuminanceAnalysisPage';
import IsolineGeneratorPage from './features/isoline-generator/IsolineGeneratorPage';
import Dashboard from './pages/Dashboard';
import { ProjectProvider } from './context/ProjectContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <ProjectProvider>
        <Router>
          <Routes>
            <Route path="/" element={<ShellLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="schedule-builder" element={<ScheduleBuilderPage />} />
              <Route path="change-narrative" element={<ChangeNarrativePage />} />
              <Route path="luminance-analysis" element={<LuminanceAnalysisPage />} />
              <Route path="isoline-generator" element={<IsolineGeneratorPage />} />
            </Route>
          </Routes>
        </Router>
      </ProjectProvider>
    </ThemeProvider>
  );
}

export default App;
