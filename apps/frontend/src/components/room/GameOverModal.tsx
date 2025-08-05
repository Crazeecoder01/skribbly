// components/GameOverModal.tsx

import React from 'react';

interface User {
  id: string;
  name: string;
}

interface GameOverModalProps {
  finalScores: Record<string, number>;
  users: User[];
  handleLeaveRoom: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({
  finalScores,
  users,
  handleLeaveRoom,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">🎉 Game Over!</h2>
        <ul className="space-y-2 text-lg">
          {Object.entries(finalScores).map(([id, score]) => {
            const user = users.find((u) => u.id === id);
            return (
              <li key={id} className="flex justify-between font-semibold">
                <span>{user?.name || 'Unknown'}</span>
                <span className="text-blue-600">{score}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-sm text-gray-500">Thanks for playing Skribbly!</p>
        <button
          onClick={handleLeaveRoom}
          className="mt-4 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-transform hover:scale-105 shadow"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;
