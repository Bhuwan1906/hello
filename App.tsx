import React, { useState } from 'react';
import Header from './components/Header';
import Tabs from './components/Tabs';
import Medicines from './components/Medicines';
import MedicalRecords from './components/MedicalRecords';
import { Tab } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('medicines');

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <div className="container mx-auto p-4 md:p-8">
        <Header />
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="mt-8">
          {activeTab === 'medicines' && <Medicines />}
          {activeTab === 'records' && <MedicalRecords />}
        </main>
      </div>
    </div>
  );
};

export default App;
