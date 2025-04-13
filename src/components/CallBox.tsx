'use client';

import { useState } from 'react';
import { HiPhone, HiPlay } from 'react-icons/hi';

const CallBox = () => {
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    const audio = document.getElementById('preview-audio') as HTMLAudioElement;
    if (audio) {
      audio.play();
      setPlaying(true);
      audio.onended = () => setPlaying(false);
    }
  };

  return (
    <div className="relative z-10 bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 border border-zinc-700/40 rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md shadow-2xl backdrop-blur-sm space-y-3 sm:space-y-4">
      <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-transparent z-0 rounded-2xl pointer-events-none" />
      <div className="text-xs sm:text-sm text-blue-400 flex items-center gap-2 z-10">
        <HiPhone />
        <span>Chamada em curso</span>
      </div>

      <div className="bg-zinc-800 text-white rounded-xl p-3 sm:p-4 shadow-inner z-10">
        <p className="text-xs sm:text-sm text-blue-300 font-semibold mb-1">Cliente:</p>
        <p className="text-sm sm:text-base">Olá, queria marcar uma limpeza dentária.</p>
      </div>

      <div className="bg-blue-600 text-white rounded-xl p-3 sm:p-4 self-end ml-auto shadow-inner z-10">
        <p className="text-xs sm:text-sm font-semibold">chamada.ai:</p>
        <p className="text-sm sm:text-base mt-1">Claro! Que dia prefere?</p>
      </div>

      {!playing && (
        <button
          onClick={handlePlay}
          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 transition shadow-md text-white font-semibold flex items-center justify-center gap-2 z-10 text-sm sm:text-base"
        >
          <HiPlay />
          Ouvir esta chamada
        </button>
      )}

      {playing && (
        <p className="text-blue-300 text-xs sm:text-sm text-right">▶️ A reproduzir áudio...</p>
      )}

      <audio id="preview-audio" src="/audio/dental.mp3" />
    </div>
  );
};

export default CallBox; 