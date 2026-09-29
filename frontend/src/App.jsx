import React, { useState } from 'react';
import Header from './components/Header';
import Banner from './components/Banner';
import FeaturedCourses from './components/FeaturedCourses';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import CourseDetail from './components/CourseDetail';
import Classroom from './components/Classroom';
import QuizView from './components/QuizView';
import { MOCK_COURSE_DETAIL, MOCK_QUIZ_DATA } from './data/mockData';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [activeLessonId, setActiveLessonId] = useState('lsn-1-1');
  const [authModal, setAuthModal] = useState({ isOpen: false, tab: 'login' });

  const handleSelectCourse = () => {
    setCurrentView('detail');
  };

  const handleStartLearning = (lessonId = 'lsn-1-1') => {
    setActiveLessonId(lessonId);
    setCurrentView('classroom');
  };

  const handleStartQuiz = () => {
    setCurrentView('quiz');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-gray-800">
      {currentView === 'home' && (
        <>
          <Header onOpenAuth={(tab) => setAuthModal({ isOpen: true, tab })} />
          <main className="flex-1">
            <Banner onOpenAuth={(tab) => setAuthModal({ isOpen: true, tab })} />
            <FeaturedCourses onSelectCourse={handleSelectCourse} />
          </main>
          <Footer />
        </>
      )}

      {currentView === 'detail' && (
        <>
          <Header onOpenAuth={(tab) => setAuthModal({ isOpen: true, tab })} />
          <CourseDetail 
            course={MOCK_COURSE_DETAIL}
            onBack={() => setCurrentView('home')}
            onStartLearning={handleStartLearning}
            onStartQuiz={handleStartQuiz}
          />
          <Footer />
        </>
      )}

      {currentView === 'classroom' && (
        <Classroom 
          course={MOCK_COURSE_DETAIL}
          activeLessonId={activeLessonId}
          onBack={() => setCurrentView('detail')}
          onOpenQuiz={handleStartQuiz}
        />
      )}

      {currentView === 'quiz' && (
        <QuizView 
          quizData={MOCK_QUIZ_DATA}
          onBack={() => setCurrentView('classroom')}
          onComplete={(res) => console.log('Quiz Result:', res)}
        />
      )}

      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={() => setAuthModal({ isOpen: false, tab: 'login' })} 
        defaultTab={authModal.tab} 
      />
    </div>
  );
}