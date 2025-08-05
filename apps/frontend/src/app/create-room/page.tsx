'use client';

import useCreateRoomForm from "@/hooks/useCreateRoomForm";


export default function CreateRoomPage() {
  const {
    creatorName,
    setCreatorName,
    maxParticipants,
    setMaxParticipants,
    rounds,
    setRounds,
    error,
    handleCreateRoom,
  } = useCreateRoomForm();

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-rose-800 font-pressStart text-center px-4">
      <h1 className="text-2xl sm:text-4xl font-bold mb-8 text-black animate-bounce drop-shadow">
        🎨 Create Your Room
      </h1>

      <input
        type="text"
        placeholder="🧑 Your Name"
        value={creatorName}
        onChange={(e) => setCreatorName(e.target.value)}
        className="border-4 border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-300 text-lg text-center p-3 rounded-xl w-72 mb-4 transition-all duration-300"
      />

      <input
        type="number"
        min="2"
        max="12"
        placeholder="👥 Max Players (2–12)"
        value={maxParticipants}
        onChange={(e) => setMaxParticipants(Number(e.target.value))}
        className="border-4 border-yellow-400 focus:outline-none focus:ring-4 focus:ring-yellow-300 text-lg text-center p-3 rounded-xl w-72 mb-6 transition-all duration-300"
      />

      <p>Number of Rounds:</p>
      <input
        type="number"
        min={1}
        max={10}
        value={rounds}
        onChange={(e) => setRounds(Number(e.target.value))}
        className="p-2 border rounded my-2"
        placeholder="🎯 Number of Rounds"
      />

      <button
        onClick={handleCreateRoom}
        className="bg-green-500 text-white px-8 py-3 rounded-xl text-lg hover:bg-green-600 hover:scale-105 transition-transform duration-300 shadow-md border-4 border-white"
      >
        🚀 Create Room
      </button>

      {error && (
        <p className="text-red-600 font-semibold mt-6 animate-pulse">
          {error}
        </p>
      )}
    </main>
  );
}
