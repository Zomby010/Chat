// src/App.js
import { useState, useEffect } from 'react';
import { useStore } from './store';
import { MentalHealthChatbot, WelcomeScreen, Loginpage} from './components';
import Navbar from './components/navbar'; // Single correct import
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

export default function App() {
  const { user, darkMode, setDarkMode } = useStore();
  const [showResources, setShowResources] = useState(false);

  // Set initial theme based on system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (darkMode === null) {
        setDarkMode(e.matches);
      }
    };

    // Set initial value if darkMode is not already set
    if (darkMode === null) {
      setDarkMode(mediaQuery.matches);
    }

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [darkMode, setDarkMode]);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleResources = () => {
    setShowResources(!showResources);
  };

  return (
    <Router>
      <div className={`min-h-screen transition-colors ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Navbar component */}
        <Navbar 
          darkMode={darkMode} 
          toggleDarkMode={toggleDarkMode} 
          toggleResources={toggleResources} 
        />

        {/* Main Content */}
        <main className="flex h-[calc(100vh-80px)]">
          <div className="flex-1">
            <Routes>
              <Route path="/" element={user ? <MentalHealthChatbot /> : <WelcomeScreen />} />
              <Route path="/chat" element={<MentalHealthChatbot />} />
              <Route path="/sign-in" element={<Loginpage />} />
              {/* Add more routes as needed */}
            </Routes>
          </div>
          
          {/* Resource Panel - Simple placeholder since ResourcePanel doesn't exist */}
          {showResources && (
            <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Resources</h2>
                <button
                  onClick={() => setShowResources(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ×
                </button>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">Mental Health Resources</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Find helpful resources and support information
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h3 className="font-medium text-green-900 dark:text-green-100">Crisis Support</h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Emergency contacts and crisis helplines
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </Router>
  );
}