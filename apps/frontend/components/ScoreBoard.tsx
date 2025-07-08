// components/ScoreBoard.tsx
import React from 'react';

interface User {
  id: string;
  name: string;
}

interface ScoreBoardProps {
  scores: Record<string, number>;
  users: User[];
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ scores, users }) => {
  return (
    <section className="bg-gray-800 rounded-xl shadow-md p-4 w-full max-w-md mb-6 text-white">
      <h2 className="text-xl font-bold mb-3">🏆 Scoreboard</h2>
      <ul className="divide-y divide-gray-700">
        {Object.entries(scores).map(([id, score]) => {
          const user = users.find((u) => u.id === id);
          return (
            <li key={id} className="py-2 flex justify-between">
              <span>{user?.name ?? 'Unknown'}</span>
              <span className="font-bold text-yellow-300">{score}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default ScoreBoard;
