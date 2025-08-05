'use client';

import React from 'react';

interface Player {
  id: string;
  name: string;
}

interface ScoreBoardProps {
  users: Player[];
  scoreBoard: Record<string, number>;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ users, scoreBoard }) => {
  return (
    <section className="mb-8 w-full max-w-md">
      <h2 className="text-xl text-white mb-2">🏆 Scoreboard</h2>
      <ul className="bg-gray-800 text-white rounded-xl p-4 shadow space-y-2">
        {Object.entries(scoreBoard).map(([id, score]) => {
          const user = users.find((u) => u.id === id);
          return (
            <li key={id} className="flex justify-between">
              <span>{user?.name || 'Unknown'}</span>
              <span className="font-bold text-yellow-400">{score}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default ScoreBoard;
    