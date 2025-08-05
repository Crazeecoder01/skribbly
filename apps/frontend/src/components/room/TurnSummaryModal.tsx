'use client';

import React from 'react';

interface User {
  id: string;
  name: string;
}

interface TurnSummary {
  drawerId: string;
  word: string;
  correctGuessers: string[];
}

interface TurnSummaryModalProps {
  turnSummary: TurnSummary;
  users: User[];
}

const TurnSummaryModal: React.FC<TurnSummaryModalProps> = ({ turnSummary, users }) => {
  const drawerName = users.find((u) => u.id === turnSummary.drawerId)?.name || 'Unknown';
  const guessedNames =
    turnSummary.correctGuessers.length > 0
      ? turnSummary.correctGuessers
          .map((id) => users.find((u) => u.id === id)?.name || 'Unknown')
          .join(', ')
      : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg text-center w-[90%] max-w-md animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🕹️ Turn Summary</h2>

        <p className="mb-2 text-lg">
          <strong>Drawer:</strong>{' '}
          <span className="text-blue-700">{drawerName}</span>
        </p>

        <p className="mb-2 text-lg">
          <strong>Word:</strong>{' '}
          <span className="text-green-600">{turnSummary.word}</span>
        </p>

        <p className="mb-4 text-lg">
          <strong>Guessed By:</strong>{' '}
          {guessedNames ? (
            <span className="text-purple-600 font-semibold">{guessedNames}</span>
          ) : (
            <span className="text-red-500 font-semibold">No one guessed it</span>
          )}
        </p>

        <p className="text-sm text-gray-500 italic">Next round starting...</p>
      </div>
    </div>
  );
};

export default TurnSummaryModal;
