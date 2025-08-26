import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MultiSender from './pages/solana/MultiSender';
import WalletCreator from './pages/solana/WalletCreator';
import TokenCreator from './pages/solana/TokenCreator';
import TokenBurner from './pages/solana/TokenBurner';
import VanityAddress from './pages/solana/VanityAddress';
import WalletProvider from './contexts/WalletProvider';
import { SolanaWalletProvider } from './contexts/SolanaWalletContext';
import AnalyticsProvider from './contexts/AnalyticsProvider';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary context="app_root">
      <AnalyticsProvider>
        <WalletProvider>
          <SolanaWalletProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Layout><Dashboard /></Layout>} />
                <Route path="/solana/multi-sender" element={<Layout><MultiSender /></Layout>} />
                <Route path="/solana/wallet-creator" element={<Layout><WalletCreator /></Layout>} />
                <Route path="/solana/token-creator" element={<Layout><TokenCreator /></Layout>} />
                <Route path="/solana/token-burner" element={<Layout><TokenBurner /></Layout>} />
                <Route path="/solana/vanity-address" element={<Layout><VanityAddress /></Layout>} />
              </Routes>
            </Router>
          </SolanaWalletProvider>
        </WalletProvider>
      </AnalyticsProvider>
    </ErrorBoundary>
  );
}

export default App;