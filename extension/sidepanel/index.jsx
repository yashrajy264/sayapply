import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Layout from './components/Layout';
import ProfileTab from './components/ProfileTab';
import ApplyTab from './components/ApplyTab';
import QuestionBankTab from './components/QuestionBankTab';
import SettingsTab from './components/SettingsTab';
import CoverLetterTab from './components/CoverLetterTab';
import DashboardTab from './components/DashboardTab';
import SearchTab from './components/SearchTab';
import './styles/main.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('apply');

  const renderTab = () => {
    switch (activeTab) {
      case 'profile': return <ProfileTab />;
      case 'apply': return <ApplyTab />;
      case 'search': return <SearchTab />;
      case 'dashboard': return <DashboardTab />;
      case 'questions': return <QuestionBankTab />;
      case 'coverletter': return <CoverLetterTab />;
      case 'settings': return <SettingsTab />;
      default: return <ApplyTab />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderTab()}
    </Layout>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
