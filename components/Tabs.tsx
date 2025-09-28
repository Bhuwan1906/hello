import React from 'react';
import { Tab } from '../types';
import { PillIcon, FileTextIcon } from './Icons';

interface TabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'medicines', label: 'Medicines', icon: <PillIcon className="w-5 h-5 mr-2" /> },
    { id: 'records', label: 'Medical Records', icon: <FileTextIcon className="w-5 h-5 mr-2" /> },
  ];

  return (
    <div className="flex justify-center border-b border-slate-700">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as Tab)}
          className={`flex items-center py-3 px-6 text-lg font-medium transition-colors duration-200 ease-in-out focus:outline-none -mb-px
            ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-400 text-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
