import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/inter';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/pages/landing.css';
import './styles/pages/auth.css';
import './styles/pages/home.css';
import './styles/pages/mood.css';
import './styles/pages/charts.css';
import './styles/pages/chat.css';
import './styles/pages/wellbeing.css';
import './styles/pages/crisis.css';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
