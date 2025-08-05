'use client';

import React from 'react';

interface User {
  id: string;
  name: string;
}

interface ChatMessage {
  userId: string;
  message: string;
  type?: 'chat' | 'correct';
}

interface ChatMessagesProps {
  chatMessages: ChatMessage[];
  users: User[];
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ chatMessages, users }) => {
  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow-md h-60 overflow-y-auto">
      {chatMessages.map((msg, idx) => (
        <p
          key={idx}
          className={`text-sm mb-2 ${
            msg.type === 'correct' ? 'text-green-400 font-bold' : 'text-white'
          }`}
        >
          <strong>
            {users.find((u) => u.id === msg.userId)?.name || 'Unknown'}:
          </strong>{' '}
          {msg.message}
        </p>
      ))}
    </div>
  );
};

export default ChatMessages;
