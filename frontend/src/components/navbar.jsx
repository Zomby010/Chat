import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Menu, 
  X, 
  User, 
  Heart, 
  Home, 
  MessageCircle, 
  HelpCircle, 
  BookOpen,
  ChevronDown,
  LogIn,
  UserPlus,
  LogOut,
  Settings,
  Shield
} from 'lucide-react';

const Navbar = ({ toggleResources }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const closeProfileDropdown = () => {
    setIsProfileDropdownOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-content">
            {/* Brand Name */}
            <div className="brand">
              <Heart className="brand-icon" size={38} />
              <h1 className="brand-text">MindMate</h1>
            </div>

            {/* Desktop Navigation Links */}
            <div className="nav-links-desktop">
              <Link to="/welcome" className="nav-link">
                <Home size={16} />
                <span>Home</span>
              </Link>
              <Link to="/chat" className="nav-link">
                <MessageCircle size={16} />
                <span>Chatbot</span>
              </Link>
            </div>

            {/* Desktop Right Side Actions */}
            <div className="nav-actions-desktop">
              <button
                onClick={toggleResources}
                className="resources-button"
                aria-label="Toggle resources panel"
              >
                <BookOpen size={16} />
                <span>Resources</span>
              </button>
              
              {/* Profile Dropdown */}
              <div className="profile-dropdown-container">
                <button
                  onClick={toggleProfileDropdown}
                  className="profile-button"
                  aria-label="User profile menu"
                >
                  <User size={16} />
                  <span>Profile</span>
                  <ChevronDown size={14} className={`dropdown-arrow ${isProfileDropdownOpen ? 'open' : ''}`} />
                </button>
                
                {isProfileDropdownOpen && (
                  <div className="profile-dropdown">
                    <Link to="/login" className="dropdown-item" onClick={closeProfileDropdown}>
                      <LogIn size={16} />
                      <span>Sign In</span>
                    </Link>
                    <Link to="/signup" className="dropdown-item" onClick={closeProfileDropdown}>
                      <UserPlus size={16} />
                      <span>Sign Up</span>
                    </Link>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-divider"></div>
                    <Link to="/login" className="dropdown-item logout" onClick={closeProfileDropdown}>
                      <LogOut size={16} />
                      <span>Log Out</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="mobile-menu-button">
              <button
                onClick={toggleMenu}
                className="menu-toggle"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-content">
            <div className="mobile-nav-links">
              <a 
                href="#home" 
                onClick={closeMenu}
                className="mobile-nav-link"
              >
                <Home size={20} />
                <span>Home</span>
              </a>
              <a 
                href="#chatbot" 
                onClick={closeMenu}
                className="mobile-nav-link"
              >
                <MessageCircle size={20} />
                <span>Chatbot</span>
              </a>
              <a 
                href="#help" 
                onClick={closeMenu}
                className="mobile-nav-link"
              >
                <HelpCircle size={20} />
                <span>Help</span>
              </a>
            </div>
            
            {/* Mobile Actions */}
            <div className="mobile-actions">
              <button
                onClick={() => {
                  toggleResources();
                  closeMenu();
                }}
                className="mobile-resources-button"
              >
                <BookOpen size={20} />
                <span>Resources</span>
              </button>
              
              {/* Mobile Profile Actions */}
              <div className="mobile-profile-actions">
                <a href="#signin" className="mobile-profile-item" onClick={closeMenu}>
                  <LogIn size={20} />
                  <span>Sign In</span>
                </a>
                <a href="#signup" className="mobile-profile-item" onClick={closeMenu}>
                  <UserPlus size={20} />
                  <span>Sign Up</span>
                </a>
                <a href="#settings" className="mobile-profile-item" onClick={closeMenu}>
                  <Settings size={20} />
                  <span>Settings</span>
                </a>
                <a href="#privacy" className="mobile-profile-item" onClick={closeMenu}>
                  <Shield size={20} />
                  <span>Privacy</span>
                </a>
                <a href="#logout" className="mobile-profile-item logout" onClick={closeMenu}>
                  <LogOut size={20} />
                  <span>Log Out</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <style jsx>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }

        .navbar-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .navbar-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 70px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .brand:hover {
          transform: translateY(-1px);
        }

        .brand-icon {
          color: #e03e3e;
          filter: drop-shadow(0 4px 8px rgba(224, 62, 62, 0.3));
        }

        .brand-text {
          font-size: 1.75rem;
          font-weight: 800;
          margin: 0;
          background: linear-gradient(135deg, #e03e3e, #ff6b6b);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .nav-links-desktop {
          display: none;
          align-items: center;
          gap: 2rem;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
          text-decoration: none;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-weight: 500;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(255, 255, 255, 0.1);
        }

        .nav-actions-desktop {
          display: none;
          align-items: center;
          gap: 1rem;
        }

        .resources-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #5a9fd4, #87ceeb);
          color: white;
          border: none;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(90, 159, 212, 0.3);
        }

        .resources-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(90, 159, 212, 0.4);
        }

        .profile-dropdown-container {
          position: relative;
        }

        .profile-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .profile-button:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .dropdown-arrow {
          transition: transform 0.3s ease;
        }

        .dropdown-arrow.open {
          transform: rotate(180deg);
        }

        .profile-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          min-width: 200px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          z-index: 1001;
          overflow: hidden;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          color: white;
          text-decoration: none;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .dropdown-item.logout {
          color: #ff6b6b;
        }

        .dropdown-item.logout:hover {
          background: rgba(255, 107, 107, 0.1);
        }

        .dropdown-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 0.5rem 0;
        }

        .mobile-menu-button {
          display: block;
        }

        .menu-toggle {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          padding: 0.75rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .menu-toggle:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
        }

        .mobile-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          transform: translateY(-100%);
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .mobile-menu.open {
          transform: translateY(0);
          opacity: 1;
          visibility: visible;
        }

        .mobile-menu-content {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .mobile-nav-links {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: white;
          text-decoration: none;
          padding: 1rem;
          border-radius: 12px;
          font-weight: 500;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .mobile-nav-link:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateX(5px);
        }

        .mobile-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .mobile-resources-button {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: linear-gradient(135deg, #5a9fd4, #87ceeb);
          color: white;
          border: none;
          padding: 1rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(90, 159, 212, 0.3);
        }

        .mobile-resources-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(90, 159, 212, 0.4);
        }

        .mobile-profile-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .mobile-profile-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: white;
          text-decoration: none;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-weight: 500;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .mobile-profile-item:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateX(5px);
        }

        .mobile-profile-item.logout {
          color: #ff6b6b;
        }

        .mobile-profile-item.logout:hover {
          background: rgba(255, 107, 107, 0.1);
        }

        /* Desktop Styles */
        @media (min-width: 768px) {
          .nav-links-desktop {
            display: flex;
          }

          .nav-actions-desktop {
            display: flex;
          }

          .mobile-menu-button {
            display: none;
          }

          .mobile-menu {
            display: none;
          }

          .navbar-content {
            padding: 0 0.5rem;
          }
        }

        /* Large Desktop Styles */
        @media (min-width: 1024px) {
          .nav-links-desktop {
            gap: 2.5rem;
          }

          .nav-actions-desktop {
            gap: 1.5rem;
          }

          .navbar-container {
            padding: 0 2rem;
          }
        }

        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .navbar {
            background: rgba(0, 0, 0, 0.9);
            border-bottom: 2px solid #fff;
          }

          .nav-link,
          .mobile-nav-link {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.5);
          }

          .resources-button,
          .mobile-resources-button {
            background: #0066cc;
            border: 2px solid #fff;
          }
        }

        /* Focus styles for better accessibility */
        .nav-link:focus,
        .resources-button:focus,
        .profile-button:focus,
        .menu-toggle:focus,
        .mobile-nav-link:focus,
        .mobile-resources-button:focus,
        .mobile-profile-item:focus,
        .dropdown-item:focus {
          outline: 2px solid #87ceeb;
          outline-offset: 2px;
        }

        /* Smooth scrolling behavior */
        html {
          scroll-behavior: smooth;
        }

        /* Ensure content doesn't hide behind fixed navbar */
        body {
          padding-top: 70px;
        }

        /* Loading states */
        .navbar.loading {
          opacity: 0.7;
          pointer-events: none;
        }

        /* Animation for mobile menu */
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .mobile-menu.open {
          animation: slideDown 0.3s ease-out;
        }

        /* Hover effects for interactive elements */
        .brand:hover .brand-icon {
          transform: scale(1.1);
        }

        .nav-link:hover,
        .mobile-nav-link:hover {
          color: #87ceeb;
        }

        /* Active states */
        .nav-link:active,
        .mobile-nav-link:active {
          transform: translateY(0);
        }

        .resources-button:active,
        .mobile-resources-button:active {
          transform: translateY(-1px);
        }

        /* Responsive font sizes */
        @media (max-width: 480px) {
          .brand-text {
            font-size: 1.5rem;
          }

          .mobile-menu-content {
            padding: 1rem;
          }

          .mobile-nav-link,
          .mobile-profile-item {
            padding: 0.75rem;
          }
        }

        /* Close dropdown when clicking outside */
        .navbar::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: -1;
          display: ${isProfileDropdownOpen ? 'block' : 'none'};
        }
      `}</style>
    </>
  );
};

export default Navbar;