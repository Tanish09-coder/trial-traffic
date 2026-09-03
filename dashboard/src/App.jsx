import { useState } from 'react';
import { SimulationProvider } from './context/SimulationContext';
import MainLayout from './layout/MainLayout';
import Dashboard from './pages/Dashboard';
import LiveIntersection from './pages/LiveIntersection';
import TrafficIntelligence from './pages/TrafficIntelligence';
import Analytics from './pages/Analytics';
import About from './pages/About';
import SoundToggle from './components/SoundToggle';
import './index.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <SimulationProvider>
      <MainLayout currentPage={currentPage} onNavigate={setCurrentPage}>
        {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} />}
        {currentPage === 'live-intersection' && <LiveIntersection onNavigate={setCurrentPage} />}
        {currentPage === 'traffic-intelligence' && <TrafficIntelligence onNavigate={setCurrentPage} />}
        {currentPage === 'analytics' && <Analytics onNavigate={setCurrentPage} />}
        {currentPage === 'about' && <About onNavigate={setCurrentPage} />}
      </MainLayout>
      <SoundToggle />
    </SimulationProvider>
  );
}

export default App;

