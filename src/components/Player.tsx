import React, { useMemo, useState, useEffect } from 'react';
import { Track, WaveformSegment } from '../types';
import { PlayIcon, PauseIcon, LoadingSpinner } from './icons';
import { getWaveformColorData } from '../services/geminiService';

interface PlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  pitch: number;
  onPlayPause: () => void;
  onPitchChange: (pitch: number) => void;
}

const colorMap = {
    bass: '#ef4444',       // Czerwony
    percussion: '#facc15', // Żółty
    vocal: '#4ade80',      // Zielony
    break: '#60a5fa',      // Niebieski
};

const ColorWaveform: React.FC<{ track: Track }> = ({ track }) => {
    const [segments, setSegments] = useState<WaveformSegment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getWaveformColorData(track).then(data => {
            setSegments(data);
            setIsLoading(false);
        });
    }, [track.id]);

    const pseudoRandomHeight = (seed: number) => {
        let x = Math.sin(seed) * 10000;
        return (x - Math.floor(x)) * 70 + 20; // 20% to 90%
    };

    const waveformBars = useMemo(() => {
        if (isLoading || segments.length === 0) {
            return Array(120).fill(0).map((_, i) => ({
                height: pseudoRandomHeight(track.id + i * 0.1),
                color: '#4b5563', // Szary placeholder
            }));
        }

        const bars = [];
        let barIndex = 0;
        for (const segment of segments) {
            const numBars = Math.round((segment.percentage / 100) * 120);
            for (let i = 0; i < numBars && barIndex < 120; i++) {
                bars.push({
                    height: pseudoRandomHeight(track.id + barIndex * 0.1),
                    color: colorMap[segment.type] || '#4b5563',
                });
                barIndex++;
            }
        }
        return bars;
    }, [track.id, segments, isLoading]);

    return (
        <div className="h-16 w-full flex items-center justify-center gap-1" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
            {isLoading ? (
                 <LoadingSpinner className="w-8 h-8 text-cyan-400" />
            ) : (
                waveformBars.map((d, i) => (
                    <div key={i} className="w-1 rounded-full transition-all duration-300" style={{
                        height: `${d.height}%`,
                        backgroundColor: d.color,
                        opacity: 0.85
                    }}></div>
                ))
            )}
        </div>
    );
};


const Player: React.FC<PlayerProps> = ({ currentTrack, isPlaying, onPlayPause, pitch, onPitchChange }) => {
  const [isRecording, setIsRecording] = useState(false);

  if (!currentTrack) return null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black to-black/80 backdrop-blur-sm border-t border-cyan-400/20 p-4 z-50 animate-slide-in-up">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <img src={currentTrack.coverArt} alt="Okładka" className="w-16 h-16 rounded-md object-cover hidden sm:block shadow-lg" />
        <div className="flex-grow min-w-0">
          <p className="font-bold text-cyan-200 truncate">{currentTrack.title}</p>
          <p className="text-sm text-gray-400 truncate">{currentTrack.artist}</p>
        </div>

        <div className="flex items-center gap-3">
            <button disabled className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"><i className="fa-solid fa-backward-step text-xl"></i></button>
             <button onClick={onPlayPause} className="bg-cyan-400 text-black rounded-full w-16 h-16 flex items-center justify-center hover:bg-cyan-300 transition-colors shadow-lg">
              {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
            </button>
            <button disabled className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"><i className="fa-solid fa-forward-step text-xl"></i></button>
        </div>
        
        <div className="flex-grow hidden lg:flex items-center gap-3 px-4">
             <ColorWaveform track={currentTrack} />
        </div>

        <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2 w-40">
               <label htmlFor="pitch" className="text-sm font-bold text-gray-400">Pitch</label>
                <input
                    id="pitch"
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.01}
                    value={pitch}
                    onChange={e => onPitchChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-sm"
                />
            </div>
            <button onClick={() => setIsRecording(!isRecording)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-red-400 hover:bg-gray-600'}`}>
                <i className="fa-solid fa-circle"></i>
            </button>
        </div>

      </div>
    </footer>
  );
};

export default Player;