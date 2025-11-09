import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Track, Playlist, SmartPlaylist, RuleCondition, FilterState } from './types';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TrackList from './components/TrackList';
import TrackInfoPanel from './components/TrackInfoPanel';
import Player from './components/Player';
import ChatBot from './components/ChatBot';
import AudioTranscriber from './components/AudioTranscriber';
import DropZone from './components/DropZone';
import SmartCollectionModal from './utils/SmartCollectionModal';
import { generatePlaylistOrderWithAI, findSimilarTracks } from './services/geminiService';
import { createReverbImpulseResponse } from './utils/audioUtils';
import XMLConverter, { ExportManager } from './components/XMLConverter';

const App: React.FC = () => {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [smartPlaylists, setSmartPlaylists] = useState<SmartPlaylist[]>([]);
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
    const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
    const [isReordering, setIsReordering] = useState(false);
    
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const [isSmartCollectionModalOpen, setIsSmartCollectionModalOpen] = useState(false);
    const [isFindingSimilar, setIsFindingSimilar] = useState(false);
    const [tempPlaylist, setTempPlaylist] = useState<Playlist | null>(null);
    const [isXmlConverterOpen, setIsXmlConverterOpen] = useState(false);
    const [isExportManagerOpen, setIsExportManagerOpen] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const trackSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const eqNodesRef = useRef<BiquadFilterNode[]>([]);
    const delayNodeRef = useRef<DelayNode | null>(null);
    const feedbackNodeRef = useRef<GainNode | null>(null);
    const delayMixNodeRef = useRef<GainNode | null>(null);
    const reverbNodeRef = useRef<ConvolverNode | null>(null);
    const reverbMixNodeRef = useRef<GainNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const dragCounter = useRef(0);

    const [isAudioReady, setIsAudioReady] = useState(false);
    
    const [effectsState, setEffectsState] = useState({
        eqBands: [
            { frequency: 150, gain: 0, type: 'lowshelf' as BiquadFilterType },
            { frequency: 1000, gain: 0, type: 'peaking' as BiquadFilterType },
            { frequency: 5000, gain: 0, type: 'highshelf' as BiquadFilterType },
        ],
        pitch: 1.0,
        delay: { time: 0.0, feedback: 0.0, mix: 0.0 },
        reverb: { mix: 0.0 },
    });

    const [filters, setFilters] = useState<FilterState>({
        bpm: { min: 0, max: 300 },
        key: '',
        genre: ''
    });
    
    const applyRules = (allTracks: Track[], rules: RuleCondition[], matchType: 'all' | 'any'): Track[] => {
        return allTracks.filter(track => {
            const checkRule = (rule: RuleCondition) => {
                const trackValue = track[rule.field];
                if (trackValue === null || trackValue === undefined) return false;
                const ruleValue = rule.value;
                const tv = String(trackValue).toLowerCase();
                const rv = String(ruleValue).toLowerCase();

                switch (rule.operator) {
                    case 'contains': return tv.includes(rv);
                    case 'not_contains': return !tv.includes(rv);
                    case 'is': return tv === rv;
                    case 'is_not': return tv !== rv;
                    case 'eq': return Number(trackValue) === Number(ruleValue);
                    case 'neq': return Number(trackValue) !== Number(ruleValue);
                    case 'gt': return Number(trackValue) > Number(ruleValue);
                    case 'lt': return Number(trackValue) < Number(ruleValue);
                    default: return false;
                }
            };
            return matchType === 'all' ? rules.every(checkRule) : rules.some(checkRule);
        });
    };

    const allGenres = useMemo(() => [...new Set(tracks.map(t => t.genre))], [tracks]);
    const allKeys = useMemo(() => [...new Set(tracks.map(t => t.key).filter(Boolean) as string[])].sort(), [tracks]);
    
    const displayedTracks = useMemo(() => {
        let baseTracks: Track[] = [];

        if (activePlaylistId?.startsWith('temp-')) {
            baseTracks = tempPlaylist?.trackIds.map(tid => tracks.find(t => t.id === tid)).filter((t): t is Track => !!t) ?? [];
        } else {
            const activeSmartPlaylist = smartPlaylists.find(p => p.id === activePlaylistId);
            if (activeSmartPlaylist) {
                baseTracks = applyRules(tracks, activeSmartPlaylist.rules, activeSmartPlaylist.matchType);
            } else {
                const activePlaylist = playlists.find(p => p.id === activePlaylistId);
                if (activePlaylist) {
                    baseTracks = activePlaylist.trackIds
                        .map(tid => tracks.find(t => t.id === tid))
                        .filter((t): t is Track => !!t);
                } else {
                    baseTracks = tracks;
                }
            }
        }
        
        return baseTracks.filter(track => {
            const bpmMatch = (track.bpm || 0) >= (filters.bpm.min || 0) && (track.bpm || 0) <= (filters.bpm.max || 300);
            const keyMatch = !filters.key || track.key === filters.key;
            const genreMatch = !filters.genre || track.genre === filters.genre;
            return bpmMatch && keyMatch && genreMatch;
        });

    }, [activePlaylistId, playlists, smartPlaylists, tracks, filters, tempPlaylist]);

    const initAudioContext = useCallback(() => {
        if (audioContextRef.current) return;
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = context;

        gainNodeRef.current = context.createGain();
        gainNodeRef.current.connect(context.destination);

        reverbMixNodeRef.current = context.createGain();
        reverbMixNodeRef.current.gain.value = 0;
        reverbMixNodeRef.current.connect(gainNodeRef.current);
        reverbNodeRef.current = context.createConvolver();
        reverbNodeRef.current.buffer = createReverbImpulseResponse(context);
        reverbNodeRef.current.connect(reverbMixNodeRef.current);

        delayMixNodeRef.current = context.createGain();
        delayMixNodeRef.current.gain.value = 0;
        delayMixNodeRef.current.connect(gainNodeRef.current);
        feedbackNodeRef.current = context.createGain();
        feedbackNodeRef.current.gain.value = 0;
        delayNodeRef.current = context.createDelay();
        delayNodeRef.current.delayTime.value = 0;
        delayNodeRef.current.connect(feedbackNodeRef.current);
        feedbackNodeRef.current.connect(delayNodeRef.current);
        delayNodeRef.current.connect(delayMixNodeRef.current);

        eqNodesRef.current = effectsState.eqBands.map(band => {
            const filter = context.createBiquadFilter();
            filter.type = band.type;
            filter.frequency.value = band.frequency;
            filter.gain.value = band.gain;
            return filter;
        });
        for (let i = 0; i < eqNodesRef.current.length - 1; i++) eqNodesRef.current[i].connect(eqNodesRef.current[i + 1]);
        
        const lastEq = eqNodesRef.current[eqNodesRef.current.length - 1];
        lastEq.connect(delayNodeRef.current);
        lastEq.connect(reverbNodeRef.current);
        lastEq.connect(gainNodeRef.current);

        setIsAudioReady(true);
    }, [effectsState.eqBands]);

    useEffect(() => {
        if (!isAudioReady) return;
        effectsState.eqBands.forEach((band, index) => {
            if (eqNodesRef.current[index]) eqNodesRef.current[index].gain.value = band.gain;
        });
        if (trackSourceRef.current) trackSourceRef.current.playbackRate.value = effectsState.pitch;
        if (delayNodeRef.current) delayNodeRef.current.delayTime.value = effectsState.delay.time;
        if (feedbackNodeRef.current) feedbackNodeRef.current.gain.value = effectsState.delay.feedback;
        if (delayMixNodeRef.current) delayMixNodeRef.current.gain.value = effectsState.delay.mix;
        if (reverbMixNodeRef.current) reverbMixNodeRef.current.gain.value = effectsState.reverb.mix;
    }, [effectsState, isAudioReady]);
    
    const handleDrop = useCallback(async (event: DragEvent) => {
        event.preventDefault();
        dragCounter.current = 0;
        setIsDraggingOver(false);
        if (!event.dataTransfer?.files) return;

        const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('audio/'));
        if (files.length === 0) return;

        const newTracksPromises = files.map(async (file, index) => {
            const tempAudioContext = new AudioContext();
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await tempAudioContext.decodeAudioData(arrayBuffer);
            await tempAudioContext.close();
            return {
                id: Date.now() + index,
                title: file.name.replace(/\.[^/.]+$/, ""), artist: 'Nieznany', album: 'Lokalny plik',
                duration: Math.round(audioBuffer.duration), bpm: null, key: null, genre: 'Nieznany',
                year: new Date().getFullYear(), coverArt: `https://picsum.photos/seed/${Date.now() + index}/500/500`,
                filePath: URL.createObjectURL(file), cues: [],
            };
        });

        try {
            const newTracks = await Promise.all(newTracksPromises);
            setTracks(prev => [...prev, ...newTracks]);
        } catch (error) {
            console.error("Błąd podczas przetwarzania upuszczonych plików:", error);
            alert("Wystąpił błąd podczas przetwarzania jednego z plików.");
        }
    }, []);

    useEffect(() => {
        const preventDefaults = (e: Event) => e.preventDefault();
        const handleDragEnter = (e: DragEvent) => { e.preventDefault(); dragCounter.current++; if (e.dataTransfer?.items?.length > 0) setIsDraggingOver(true); };
        const handleDragLeave = (e: DragEvent) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setIsDraggingOver(false); };
        const handleDropEvent = (e: DragEvent) => handleDrop(e);

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => window.addEventListener(eventName, preventDefaults));
        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('drop', handleDropEvent);
        return () => {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => window.removeEventListener(eventName, preventDefaults));
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('drop', handleDropEvent);
        };
    }, [handleDrop]);


    const handleEffectChange = (effect: string, value: any) => {
        setEffectsState(prev => {
            const newState = JSON.parse(JSON.stringify(prev)); // Deep copy
            const keys = effect.split('.');
            let current = newState;
            for(let i = 0; i < keys.length - 1; i++) current = current[keys[i]];
            current[keys[keys.length - 1]] = value;
            return newState;
        });
    };
    
    const handleSelectTrack = useCallback(async (track: Track) => {
        if (!audioContextRef.current) return;
        if (trackSourceRef.current) trackSourceRef.current.stop();
        
        setSelectedTrack(track);
        setCurrentTrack(track);

        try {
            const response = await fetch(track.filePath);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
            
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = effectsState.pitch;
            if(eqNodesRef.current[0]) source.connect(eqNodesRef.current[0]);
            source.start();

            trackSourceRef.current = source;
            setIsPlaying(true);
        } catch (e) {
            console.error("Błąd ładowania lub dekodowania pliku audio:", e);
            setIsPlaying(false);
        }
    }, [effectsState.pitch]);
    
    const handlePlayPause = useCallback(() => {
        if (!audioContextRef.current) { initAudioContext(); return; }
        if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();

        if (isPlaying) {
            audioContextRef.current.suspend();
            setIsPlaying(false);
        } else {
            if (currentTrack) {
                setIsPlaying(true);
            } else if(displayedTracks.length > 0) {
                handleSelectTrack(displayedTracks[0]);
            }
        }
    }, [isPlaying, currentTrack, displayedTracks, handleSelectTrack, initAudioContext]);
    
    const handleUpdateTrack = (updatedTrack: Track) => {
        setTracks(prev => prev.map(t => t.id === updatedTrack.id ? updatedTrack : t));
        if (selectedTrack?.id === updatedTrack.id) setSelectedTrack(updatedTrack);
        if (currentTrack?.id === updatedTrack.id) setCurrentTrack(updatedTrack);
    };
    
    const handleReorderPlaylist = async () => {
        if (!activePlaylistId || smartPlaylists.some(p => p.id === activePlaylistId) || activePlaylistId.startsWith('temp-')) return;
        setIsReordering(true);
        const sortedTracks = await generatePlaylistOrderWithAI(displayedTracks);
        const sortedTrackIds = sortedTracks.map(t => t.id);
        setPlaylists(prev => prev.map(p => p.id === activePlaylistId ? {...p, trackIds: sortedTrackIds} : p));
        setIsReordering(false);
    };

    const handleSaveSmartPlaylist = (playlist: SmartPlaylist) => {
        setSmartPlaylists(prev => prev.find(p => p.id === playlist.id) ? prev.map(p => p.id === playlist.id ? playlist : p) : [...prev, playlist]);
        setIsSmartCollectionModalOpen(false);
    };
    
    const handleFindSimilar = async (track: Track) => {
        setIsFindingSimilar(true);
        const similarTracks = await findSimilarTracks(track, tracks);
        const newTempPlaylist: Playlist = {
            id: `temp-${Date.now()}`, name: `Podobne do "${track.title}"`,
            trackIds: similarTracks.map(t => t.id)
        };
        setTempPlaylist(newTempPlaylist);
        setActivePlaylistId(newTempPlaylist.id);
        setIsFindingSimilar(false);
    };
    
    const handleSelectPlaylist = (id: string | null) => {
        if (id !== activePlaylistId && !id?.startsWith('temp-')) setTempPlaylist(null);
        setActivePlaylistId(id);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] to-[#16213e] p-4 sm:p-6 lg:p-8" onClick={!isAudioReady ? initAudioContext : undefined}>
            <div className="max-w-screen-2xl mx-auto">
                <Header 
                    onOpenXmlConverter={() => setIsXmlConverterOpen(true)} 
                    onOpenExportManager={() => setIsExportManagerOpen(true)}
                />
                <main className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                    <Sidebar
                        playlists={playlists}
                        smartPlaylists={smartPlaylists}
                        tempPlaylist={tempPlaylist}
                        activePlaylistId={activePlaylistId}
                        onSelectPlaylist={handleSelectPlaylist}
                        trackCount={tracks.length}
                        onNewCollection={() => setIsSmartCollectionModalOpen(true)}
                    />
                    <TrackList
                        tracks={displayedTracks}
                        onSelectTrack={handleSelectTrack}
                        selectedTrackId={selectedTrack?.id || null}
                        onReorder={handleReorderPlaylist}
                        isReordering={isReordering}
                        isPlaylistActive={!!activePlaylistId && !smartPlaylists.some(p => p.id === activePlaylistId) && !activePlaylistId.startsWith('temp-')}
                        filters={filters}
                        onFilterChange={setFilters}
                        allGenres={allGenres}
                        allKeys={allKeys}
                    />
                    <TrackInfoPanel track={selectedTrack} onUpdateTrack={handleUpdateTrack} effectsState={effectsState} onEffectChange={handleEffectChange} onFindSimilar={handleFindSimilar} isFindingSimilar={isFindingSimilar}/>
                </main>
                <div className="mt-6">
                  <AudioTranscriber />
                </div>
                <Player 
                    currentTrack={currentTrack} 
                    isPlaying={isPlaying} 
                    onPlayPause={handlePlayPause}
                    pitch={effectsState.pitch}
                    onPitchChange={(p) => handleEffectChange('pitch', p)}
                />
                <ChatBot />
                {isSmartCollectionModalOpen && (
                    <SmartCollectionModal 
                        onClose={() => setIsSmartCollectionModalOpen(false)}
                        onSave={handleSaveSmartPlaylist}
                        allGenres={allGenres}
                        allKeys={allKeys}
                    />
                )}
                 {isXmlConverterOpen && <XMLConverter onClose={() => setIsXmlConverterOpen(false)} />}
                 {isExportManagerOpen && <ExportManager onClose={() => setIsExportManagerOpen(false)} />}
            </div>
             {!isAudioReady && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100]">
                    <div className="text-center p-8 bg-[#16213e] rounded-2xl border border-cyan-400/20">
                        <h2 className="text-2xl font-bold text-cyan-300 mb-4">Wymagana interakcja</h2>
                        <p className="text-gray-300">Kliknij w dowolnym miejscu, aby zainicjować system audio.</p>
                    </div>
                </div>
            )}
            {isDraggingOver && <DropZone />}
            <div className="pb-28"></div>
        </div>
    );
};

export default App;
