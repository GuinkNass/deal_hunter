import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AnalysesPage from './pages/AnalysesPage';
import CalculatorPage from './pages/CalculatorPage';
import SettingsPage from './pages/SettingsPage';
import StatusPage from './pages/StatusPage';
import AnalysisDetailModal from './components/AnalysisDetailModal';
import MarginCalculatorModal from './components/MarginCalculatorModal';
import ManualSearchModal from './components/ManualSearchModal';
import { fetchStatus, fetchAnalysisById } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('analyses'); // 'analyses', 'calculator', 'settings', 'status'
  const [statusData, setStatusData] = useState(null);

  // Modals state
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [calculatorData, setCalculatorData] = useState(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isManualSearchOpen, setIsManualSearchOpen] = useState(false);

  useEffect(() => {
    // Check URL parameters for direct analysis view or settings redirect
    const params = new URLSearchParams(window.location.search);
    const analysisId = params.get('analysis');
    const mlConnected = params.get('ml_connected');
    const mlError = params.get('ml_error');

    if (analysisId) {
      fetchAnalysisById(analysisId).then(res => {
        if (res.success && res.data) {
          setSelectedAnalysis(res.data);
        }
      });
    }

    if (mlConnected || mlError) {
      setActiveTab('settings');
      if (mlConnected) {
        alert('🎉 Conta Mercado Livre conectada com sucesso!');
      } else if (mlError) {
        alert(`Erro ao conectar Mercado Livre: ${mlError}`);
      }
      // Clean query params
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Load general status
    fetchStatus().then(res => {
      if (res.success) setStatusData(res.data);
    });
  }, []);

  function handleOpenCalculator(analysis = null) {
    setCalculatorData(analysis);
    setIsCalculatorOpen(true);
  }

  function handleManualSuccess(newAnalysis) {
    setSelectedAnalysis(newAnalysis);
    setActiveTab('analyses');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenManualSearch={() => setIsManualSearchOpen(true)}
        onOpenCalculator={() => handleOpenCalculator(null)}
        statusData={statusData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'analyses' && (
          <AnalysesPage
            onSelectAnalysis={(item) => setSelectedAnalysis(item)}
            onOpenManualSearch={() => setIsManualSearchOpen(true)}
            onOpenCalculator={(item) => handleOpenCalculator(item)}
          />
        )}

        {activeTab === 'calculator' && (
          <CalculatorPage />
        )}

        {activeTab === 'settings' && (
          <SettingsPage />
        )}

        {activeTab === 'status' && (
          <StatusPage />
        )}
      </main>

      {/* Detail Modal */}
      {selectedAnalysis && (
        <AnalysisDetailModal
          analysis={selectedAnalysis}
          onClose={() => setSelectedAnalysis(null)}
          onOpenCalculator={(item) => {
            setSelectedAnalysis(null);
            handleOpenCalculator(item);
          }}
        />
      )}

      {/* Margin Calculator Modal */}
      {isCalculatorOpen && (
        <MarginCalculatorModal
          initialData={calculatorData}
          onClose={() => {
            setIsCalculatorOpen(false);
            setCalculatorData(null);
          }}
        />
      )}

      {/* Manual Search Modal */}
      {isManualSearchOpen && (
        <ManualSearchModal
          onClose={() => setIsManualSearchOpen(false)}
          onSuccess={handleManualSuccess}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ML Radar • Sistema de Arbitragem & Inteligência de Ofertas</span>
          <span>100% Gratuito (Mercado Livre API + Google Gemini AI Studio + Telegram)</span>
        </div>
      </footer>
    </div>
  );
}
