
import React, { useState, useEffect } from 'react';
import { Track } from '../types';
import { analyzeTrackWithAI, generateSpeech, getAutoCompleteMetadata } from '../services/geminiService';
import { WandIcon, LoadingSpinner } from './icons';
import { decodeAndPlayAudio } from '../utils/audioUtils';
import EffectsRack from './EffectsRack';
import ImageEditor from './ImageEditor';

interface TrackInfoPanelProps {
  track: Track | null;
  onUpdateTrack: (updatedTrack: Track) => void;
  effectsState: {
    eqBands: { frequency: number; gain: number; type: BiquadFilterType; }[];
    pitch: number;
    delay: { time: number; feedback: number; mix: number; };
    reverb: { mix: number; };
  };
  onEffectChange: (effect: string, value: any) => void;
  onFindSimilar: (track: Track) => void;
  isFindingSimilar: boolean;
}

const TrackInfoPanel: React.FC<TrackInfoPanelProps> = ({ track, onUpdateTrack, effectsState, onEffectChange, onFindSimilar, isFindingSimilar }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [effectsVisible, setEffectsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTrack, setEditedTrack] = useState<Track | null>(null);
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);

  useEffect(() => {
    setIsEditing(false);
    setEditedTrack(null);
  }, [track]);

  const handleAnalyze = async () => {
    if (!track) return;
    setIsAnalyzing(true);
    const analysis = await analyzeTrackWithAI(track);
    onUpdateTrack({ ...track, ...analysis });
    setIsAnalyzing(false);
  };
  
  const handleAutoComplete = async () => {
    if (!track) return;
    setIsAutoCompleting(true);
    const completion = await getAutoCompleteMetadata(track);
    onUpdateTrack({ ...track, ...completion });
    setIsAutoCompleting(false);
  }

  const handleFindSimilarClick = () => {
    if (track) {
      onFindSimilar(track);
    }
  };

  const handleSpeak = async () => {
    if (!track) return;
    
    const context = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioContext) setAudioContext(context);

    setIsSpeaking(true);
    const textToSpeak = `Utwór ${track.title} wykonawcy ${track.artist}. Gatunek: ${track.genre}, BPM: ${track.bpm}, tonacja: ${track.key}.`;
    const audioData = await generateSpeech(textToSpeak);
    if (audioData) {
        await decodeAndPlayAudio(audioData, context);
    }
    setIsSpeaking(false);
  };

  const handleEditToggle = () => {
      if (isEditing && editedTrack) {
          onUpdateTrack(editedTrack);
          setIsEditing(false);
      } else {
          setEditedTrack(track);
          setIsEditing(true);
      }
  };

  const handleCancelEdit = () => {
      setIsEditing(false);
      setEditedTrack(null);
  };

  const handleInputChange = (field: keyof Track, value: string | number | null) => {
    if (editedTrack) {
        setEditedTrack({ ...editedTrack, [field]: value });
    }
  };
  
  const handleImageEditSave = (newImageUrl: string) => {
    if (track) {
        onUpdateTrack({ ...track, coverArt: newImageUrl });
    }
    setIsImageEditorOpen(false);
  };

  if (!track) {
    return (
      <aside className="w-full lg:w-96 bg-black bg-opacity-20 p-4 rounded-2xl border border-cyan-400/10 flex-shrink-0 flex items-center justify-center">
        <p className="text-gray-500">Wybierz utwór, aby zobaczyć szczegóły</p>
      </aside>
    );
  }
  
  const currentDisplayTrack = isEditing && editedTrack ? editedTrack : track;

  const DetailItem: React.FC<{ label: string; value: string | number | null; isEditing: boolean; field: keyof Track; type?: string }> = ({ label, value, isEditing, field, type = 'text' }) => (
    <>
        <dt className="text-gray-400 font-bold">{label}</dt>
        <dd className="text-cyan-200 truncate">
            {isEditing ? (
                <input
                    type={type}
                    value={value ?? ''}
                    onChange={(e) => handleInputChange(field, type === 'number' ? (e.target.value ? parseInt(e.target.value) : null) : e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
            ) : (
                value ?? 'Brak'
            )}
        </dd>
    </>
  );

  return (
    <>
    <aside className="w-full lg:w-96 bg-black bg-opacity-20 p-4 rounded-2xl border border-cyan-400/10 flex-shrink-0 flex flex-col gap-4">
      <div className="overflow-y-auto pr-2">
        <h2 className="text-xl font-bold text-pink-400 mb-4">Informacje o utworze</h2>
        <div className="relative group">
            <img src={currentDisplayTrack.coverArt} alt="Okładka albumu" className="w-full aspect-square rounded-lg object-cover mb-4 shadow-lg" />
            <button onClick={() => setIsImageEditorOpen(true)} disabled={isEditing} className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 rounded-lg disabled:opacity-0 disabled:cursor-not-allowed">
                <div className="text-center">
                    <i className="fa-solid fa-wand-magic-sparkles text-3xl text-white"></i>
                    <p className="text-white font-bold mt-2">Edytuj z AI</p>
                </div>
            </button>
        </div>

        {isEditing ? (
             <input type="text" value={currentDisplayTrack.title} onChange={e => handleInputChange('title', e.target.value)} className="w-full bg-transparent text-lg font-semibold text-cyan-200 border-b-2 border-cyan-500 focus:outline-none mb-1"/>
        ) : (
             <h3 className="text-lg font-semibold text-cyan-200 truncate">{currentDisplayTrack.title}</h3>
        )}
       
        {isEditing ? (
            <input type="text" value={currentDisplayTrack.artist} onChange={e => handleInputChange('artist', e.target.value)} className="w-full bg-transparent text-gray-400 border-b-2 border-gray-600 focus:outline-none"/>
        ) : (
             <p className="text-gray-400 truncate">{currentDisplayTrack.artist}</p>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <DetailItem label="Album" value={currentDisplayTrack.album} isEditing={isEditing} field="album" />
            <DetailItem label="Gatunek" value={currentDisplayTrack.genre} isEditing={isEditing} field="genre" />
            <DetailItem label="Rok" value={currentDisplayTrack.year} isEditing={isEditing} field="year" type="number" />
            <DetailItem label="BPM" value={currentDisplayTrack.bpm} isEditing={isEditing} field="bpm" type="number" />
            <DetailItem label="Tonacja" value={currentDisplayTrack.key} isEditing={isEditing} field="key" />
             {track.mood && !isEditing && <><dt className="text-gray-400 font-bold">Nastrój (AI)</dt><dd className="text-green-400">{track.mood}</dd></>}
             {track.energy && !isEditing && <><dt className="text-gray-400 font-bold">Energia (AI)</dt><dd className="text-green-400">{track.energy}/100</dd></>}
        </dl>
        
        <div className="mt-6 flex flex-col space-y-3">
             {isEditing ? (
                <div className="flex gap-2">
                    <button onClick={handleCancelEdit} className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors">Anuluj</button>
                    <button onClick={handleEditToggle} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#39ff14] to-[#00ff88] text-black font-bold rounded-lg hover:opacity-90 transition-opacity">
                        <i className="fa-solid fa-save"></i> <span>Zapisz</span>
                    </button>
                </div>
            ) : (
                <button onClick={handleEditToggle} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:opacity-90 transition-opacity">
                     <i className="fa-solid fa-pen"></i> <span>Edytuj Tagi</span>
                </button>
            )}
              <button onClick={handleAutoComplete} disabled={isAutoCompleting || isEditing} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                  {isAutoCompleting ? <LoadingSpinner className="w-5 h-5" /> : <i className="fa-solid fa-file-pen w-5 h-5"></i>}
                  <span>Uzupełnij Tagi (AI)</span>
              </button>
              <button onClick={handleAnalyze} disabled={isAnalyzing || isEditing} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                  {isAnalyzing ? <LoadingSpinner className="w-5 h-5" /> : <WandIcon />}
                  <span>Analizuj Nastrój</span>
              </button>
              <button onClick={handleFindSimilarClick} disabled={isFindingSimilar || isEditing} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                  {isFindingSimilar ? <LoadingSpinner className="w-5 h-5" /> : <i className="fa-solid fa-magnifying-glass-chart w-5 h-5"></i>}
                  <span>Znajdź podobne</span>
              </button>
              <button onClick={handleSpeak} disabled={isSpeaking || isEditing} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSpeaking ? <LoadingSpinner className="w-5 h-5" /> : <i className="fa-solid fa-volume-high w-5 h-5"></i>}
                  <span>Odtwórz opis (TTS)</span>
              </button>
        </div>
      </div>
      <div className="mt-auto border-t border-cyan-400/20 pt-4">
        <button onClick={() => setEffectsVisible(!effectsVisible)} className="w-full text-left text-lg font-bold text-pink-400 flex justify-between items-center">
          <span>Efekty Audio</span>
          <i className={`fa-solid fa-chevron-down transition-transform ${effectsVisible ? 'rotate-180' : ''}`}></i>
        </button>
        {effectsVisible && <EffectsRack effectsState={effectsState} onEffectChange={onEffectChange} />}
      </div>
    </aside>
    {isImageEditorOpen && track && (
        <ImageEditor
            imageUrl={track.coverArt}
            onClose={() => setIsImageEditorOpen(false)}
            onSave={handleImageEditSave}
        />
    )}
    </>
  );
};

export default TrackInfoPanel;