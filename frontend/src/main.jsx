import React from 'react';
import { createRoot } from 'react-dom/client';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  initiaPrivyWalletConnector,
  InterwovenKitProvider,
} from '@initia/interwovenkit-react';
import App from './App.jsx';

const wagmiConfig = createConfig({
  connectors: [initiaPrivyWalletConnector],
  chains: [mainnet],
  transports: { [mainnet.id]: http() },
});

const queryClient = new QueryClient();

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <InterwovenKitProvider
          defaultChainId="initiation-2"
          enableAutoSign={true}
          theme="dark"
        >
          <App />
        </InterwovenKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById('root')).render(<Root />);
