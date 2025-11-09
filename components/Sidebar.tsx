
import React from 'react';
import { Playlist, SmartPlaylist } from '../types';

interface SidebarProps {
  playlists: Playlist[];
  smartPlaylists: SmartPlaylist[];
  tempPlaylist: Playlist | null;
  activePlaylistId: string | null;
  onSelectPlaylist: (id: string | null) => void;
  trackCount: number;
  onNewCollection: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ playlists, smartPlaylists, tempPlaylist, activePlaylistId, onSelectPlaylist, trackCount, onNewCollection }) => {
  return (
    <aside className="w-full md:w-64 bg-black bg-opacity-20 p-4 rounded-2xl border border-cyan-400/10 flex-shrink-0">
      <div>
        <h2 className="text-lg font-bold text-[#8ef0ff] mb-3 flex items-center gap-2">
          <i className="fa-solid fa-folder"></i> Źródła
        </h2>
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => onSelectPlaylist(null)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                activePlaylistId === null ? 'bg-cyan-400/20 text-cyan-200' : 'hover:bg-cyan-400/10'
              }`}
            >
              <i className="fa-solid fa-database mr-2 w-4"></i>
              Wszystkie utwory <span className="text-xs opacity-60">({trackCount})</span>
            </button>
          </li>
           <li>
            <button
              disabled
              className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 opacity-50 cursor-not-allowed`}
            >
              <i className="fa-solid fa-star mr-2 w-4"></i>
              Ulubione
            </button>
          </li>
           <li>
            <button
               disabled
              className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 opacity-50 cursor-not-allowed`}
            >
              <i className="fa-solid fa-clock-rotate-left mr-2 w-4"></i>
              Ostatnio dodane
            </button>
          </li>
        </ul>
      </div>
      <div className="mt-6">
        <h2 className="text-lg font-bold text-[#ff66cc] mb-3 flex items-center gap-2">
            <i className="fa-solid fa-list-music"></i> Playlisty
        </h2>
        <ul className="space-y-2">
          {playlists.map((playlist) => (
            <li key={playlist.id}>
              <button
                onClick={() => onSelectPlaylist(playlist.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                  activePlaylistId === playlist.id ? 'bg-pink-400/20 text-pink-200' : 'hover:bg-pink-400/10'
                }`}
              >
                <i className="fa-solid fa-play mr-2 w-4"></i>
                {playlist.name} <span className="text-xs opacity-60">({playlist.trackIds.length})</span>
              </button>
            </li>
          ))}
           {tempPlaylist && (
             <li key={tempPlaylist.id}>
               <button
                 onClick={() => onSelectPlaylist(tempPlaylist.id)}
                 className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 border border-dashed ${
                   activePlaylistId === tempPlaylist.id ? 'bg-purple-400/20 text-purple-200 border-purple-400/50' : 'hover:bg-purple-400/10 border-gray-600'
                 }`}
               >
                 <i className="fa-solid fa-wand-magic-sparkles mr-2 w-4 text-purple-300"></i>
                 {tempPlaylist.name} <span className="text-xs opacity-60">({tempPlaylist.trackIds.length})</span>
               </button>
             </li>
           )}
        </ul>
      </div>
       <div className="mt-6">
        <h2 className="text-lg font-bold text-yellow-400 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-brain"></i> Inteligentne Kolekcje
          </div>
           <button onClick={onNewCollection} className="text-sm font-normal px-2 py-1 rounded-md bg-yellow-500/50 hover:bg-yellow-500/80 transition-colors">+ Nowa</button>
        </h2>
        <ul className="space-y-2">
          {smartPlaylists.map((playlist) => (
            <li key={playlist.id}>
              <button
                onClick={() => onSelectPlaylist(playlist.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                  activePlaylistId === playlist.id ? 'bg-yellow-400/20 text-yellow-200' : 'hover:bg-yellow-400/10'
                }`}
              >
                <i className="fa-solid fa-gear mr-2 w-4"></i>
                {playlist.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;