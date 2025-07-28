import React from 'react';
import { useRoom } from '@/context/RoomContext';

export default function WordPicker() {
  const { wordChoices, handleWordSelect } = useRoom();

  return (
    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md text-center">
      <h3 className="text-xl font-bold text-gray-800 mb-4">🧠 Pick a word to draw:</h3>
      <div className="flex flex-wrap justify-center gap-4">
        {wordChoices.map((word: string) => (
          <button
            key={word}
            onClick={() => handleWordSelect(word)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-md font-semibold transition-transform hover:scale-105"
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}
