import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ErrorBoundary from './components/common/ErrorBoundary';

// Solana tool pages
import MultiSender from './pages/solana/MultiSender';
import WalletCreator from './pages/solana/WalletCreator';
import VanityGenerator from './pages/solana/VanityAddress';
import TokenCreator from './pages/solana/TokenCreator';
import TokenBurner from './pages/solana/TokenBurner';

function App() {
  return (
    <ErrorBoundary context="app_root">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={
            <ErrorBoundary context="dashboard">
              <Dashboard />
            </ErrorBoundary>
          } />
          
          {/* Solana Tools */}
          <Route path="solana/multi-sender" element={
            <ErrorBoundary context="solana_multi_sender">
              <MultiSender />
            </ErrorBoundary>
          } />
          <Route path="solana/wallet-creator" element={
            <ErrorBoundary context="solana_wallet_creator">
              <WalletCreator />
            </ErrorBoundary>
          } />
          <Route path="solana/vanity-generator" element={
  <ErrorBoundary context="solana_vanity_generator">
    <VanityAddress />
            </ErrorBoundary>
          } />
          <Route path="solana/token-creator" element={
            <ErrorBoundary context="solana_token_creator">
              <TokenCreator />
            </ErrorBoundary>
          } />
          <Route path="solana/token-burner" element={
            <ErrorBoundary context="solana_token_burner">
              <TokenBurner />
            </ErrorBoundary>
          } />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;