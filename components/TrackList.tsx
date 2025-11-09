
import React from 'react';
import { Track, FilterState } from '../types';

interface TrackListProps {
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
  selectedTrackId: number | null;
  onReorder: () => Promise<void>;
  isReordering: boolean;
  isPlaylistActive: boolean;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  allGenres: string[];
  allKeys: string[];
}

const TrackList: React.FC<TrackListProps> = ({ tracks, onSelectTrack, selectedTrackId, onReorder, isReordering, isPlaylistActive, filters, onFilterChange, allGenres, allKeys }) => {
    
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleBpmChange = (field: 'min' | 'max', value: string) => {
    onFilterChange({
        ...filters,
        bpm: { ...filters.bpm, [field]: value ? parseInt(value, 10) : (field === 'min' ? 0 : 300) }
    });
  }

  return (
    <div className="flex-grow bg-black bg-opacity-20 p-4 rounded-2xl border border-cyan-400/10 min-w-0">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-cyan-300">Lista utworów</h2>
            {isPlaylistActive && (
                 <button 
                    onClick={onReorder}
                    disabled={isReordering}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-wait flex items-center gap-2"
                >
                    {isReordering ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                    Sortuj z AI
                </button>
            )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-3 bg-black/20 rounded-lg">
            <div className="flex items-center gap-2">
                <label className="text-sm font-bold text-gray-400">BPM:</label>
                <input type="number" placeholder="Min" value={filters.bpm.min || ''} onChange={e => handleBpmChange('min', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                <span className="text-gray-500">-</span>
                <input type="number" placeholder="Max" value={filters.bpm.max || ''} onChange={e => handleBpmChange('max', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500" />
            </div>
             <div>
                <select value={filters.key} onChange={e => onFilterChange({...filters, key: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500">
                    <option value="">Wszystkie tonacje</option>
                    {allKeys.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
            </div>
            <div>
                <select value={filters.genre} onChange={e => onFilterChange({...filters, genre: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500">
                    <option value="">Wszystkie gatunki</option>
                    {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>
        </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-cyan-400/20 text-cyan-200">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Tytuł</th>
              <th className="p-3 hidden md:table-cell">Artysta</th>
              <th className="p-3 text-center hidden lg:table-cell">BPM</th>
              <th className="p-3 text-center hidden lg:table-cell">Tonacja</th>
              <th className="p-3 text-right"><i className="fa-regular fa-clock"></i></th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((track, index) => (
              <tr
                key={track.id}
                onClick={() => onSelectTrack(track)}
                className={`border-b border-gray-800/50 hover:bg-cyan-400/10 cursor-pointer transition-colors duration-150 ${
                  selectedTrackId === track.id ? 'bg-cyan-400/20' : ''
                }`}
              >
                <td className="p-3 text-gray-400">{index + 1}</td>
                <td className="p-3 font-semibold text-[#e6f7ff]">{track.title}</td>
                <td className="p-3 text-gray-400 hidden md:table-cell">{track.artist}</td>
                <td className="p-3 text-center hidden lg:table-cell">{track.bpm || '-'}</td>
                <td className="p-3 text-center hidden lg:table-cell">{track.key || '-'}</td>
                <td className="p-3 text-right text-gray-400">{formatDuration(track.duration)}</td>
              </tr>
            ))}
             {tracks.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center p-8 text-gray-500">Brak utworów pasujących do filtrów.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrackList;