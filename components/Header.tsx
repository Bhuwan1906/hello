import React from 'react';
import { PillIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="text-center mb-8 md:mb-12">
      <div className="flex items-center justify-center gap-3 mb-2">
        <PillIcon className="w-8 h-8 text-blue-400" />
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          CuraTrack
        </h1>
      </div>
      <p className="text-lg text-blue-200">
        Your medicines and medical records, in one safe place.
      </p>
    </header>
  );
};

export default Header;
