import App from './App.tsx';
import { StrictMode } from 'react';
// eslint-disable-next-line import/no-unassigned-import
import './index.css';
import { createRoot } from 'react-dom/client';

const rootElement = document.querySelector('#root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
