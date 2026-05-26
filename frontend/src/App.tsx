import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import TrendsPage from './pages/TrendsPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import RiskAlertsPage from './pages/RiskAlertsPage'

function App() {
  return (
    <Router>
      <Routes>
        {/* Login is outside Layout — no bottom nav */}
        <Route path="/login" element={<LoginPage />} />
        {/* Authenticated routes wrapped in Layout */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/trends" element={<TrendsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/alerts" element={<RiskAlertsPage />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  )
}

export default App