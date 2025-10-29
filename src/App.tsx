import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MultiSender from './pages/solana/MultiSender';
import WalletCreator from './pages/solana/WalletCreator';
import TokenCreator from './pages/solana/TokenCreatorNew';
import TokenBurner from './pages/solana/TokenBurner';
import VanityAddress from './pages/solana/VanityAddress';
import TutorialsHub from './pages/tutorials/TutorialsHub';
import WalletProvider from './contexts/WalletProvider';
import { SolanaWalletProvider } from './contexts/SolanaWalletContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TutorialProvider } from './contexts/TutorialContext';
import AnalyticsProvider from './contexts/AnalyticsProvider';
import ErrorBoundary from './components/common/ErrorBoundary';
import { TutorialOverlay } from './components/tutorial/TutorialOverlay';

function App() {
  return (
    <ErrorBoundary context="app_root">
      <AnalyticsProvider>
        <ThemeProvider>
          <WalletProvider>
            <SolanaWalletProvider>
              <TutorialProvider>
                <Router>
                  <Routes>
                    <Route path="/" element={<Layout><Dashboard /></Layout>} />
                    <Route path="/solana/multi-sender" element={<Layout><MultiSender /></Layout>} />
                    <Route path="/solana/wallet-creator" element={<Layout><WalletCreator /></Layout>} />
                    <Route path="/solana/token-creator" element={<Layout><TokenCreator /></Layout>} />
                    <Route path="/solana/token-burner" element={<Layout><TokenBurner /></Layout>} />
                    <Route path="/solana/vanity-address" element={<Layout><VanityAddress /></Layout>} />
                    <Route path="/tutorials" element={<Layout><TutorialsHub /></Layout>} />
                  </Routes>
                  <TutorialOverlay />
                </Router>
              </TutorialProvider>
            </SolanaWalletProvider>
          </WalletProvider>
        </ThemeProvider>
      </AnalyticsProvider>
    </ErrorBoundary>
  );
}

export default App;
