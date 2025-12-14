
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell';
import HomePage from './pages/HomePage';
import WizardPage from './pages/WizardPage';
import StrategyPage from './pages/StrategyPage';
import KnowledgePage from './pages/KnowledgePage';
import FaqPage from './pages/FaqPage';
import { FlightStrategyProvider } from './context/FlightStrategyContext';
import BackgroundScene from './components/3d/BackgroundScene';

function App() {
  return (
    <FlightStrategyProvider>
      <HashRouter>
        {/* Cinematic Noise Overlay */}
        <div className="noise-overlay" />

        {/* 3D Background */}
        <BackgroundScene />
        
        {/* App Content */}
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="wizard" element={<WizardPage />} />
              <Route path="strategy" element={<StrategyPage />} />
              <Route path="knowledge" element={<KnowledgePage />} />
              <Route path="faq" element={<FaqPage />} />
            </Route>
          </Routes>
        </div>
      </HashRouter>
    </FlightStrategyProvider>
  );
}

export default App;
