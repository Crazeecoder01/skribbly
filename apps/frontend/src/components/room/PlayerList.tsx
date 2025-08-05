'use client';

import React from 'react';

interface Player {
  id: string;
  name: string;
}

interface PlayerListProps {
  users: Player[];
  currentUserId: string;
}

const PlayerList: React.FC<PlayerListProps> = ({ users, currentUserId }) => {
  return (
    <section className="mb-6 w-full max-w-2xl">
      <h2 className="text-2xl text-white mb-4">👥 Players</h2>
      <ul className="bg-gray-800 rounded-2xl shadow-xl divide-y divide-gray-700">
        {users.map((user) => (
          <li
            key={user.id}
            className={`flex items-center gap-4 p-4 ${
              user.id === currentUserId
                ? 'bg-blue-700 text-white font-bold'
                : 'text-gray-200'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-400 flex items-center justify-center font-extrabold text-black shadow-inner">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="truncate">{user.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default PlayerList;
