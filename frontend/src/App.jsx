import React, { useState } from 'react';
import Header from './components/Header';
import Banner from './components/Banner';
import FeaturedCourses from './components/FeaturedCourses';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';

export default function App() {
  const [authModal, setAuthModal] = useState({ isOpen: false, tab: 'login' });

  const handleOpenAuth = (tab = 'login') => {
    setAuthModal({ isOpen: true, tab });
  };

  const handleCloseAuth = () => {
    setAuthModal({ isOpen: false, tab: 'login' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-gray-800">
      <Header onOpenAuth={handleOpenAuth} />

      <main className="flex-1">
        <Banner onOpenAuth={handleOpenAuth} />
        <FeaturedCourses />
      </main>

      <Footer />

      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={handleCloseAuth} 
        defaultTab={authModal.tab} 
      />
    </div>
  );
}