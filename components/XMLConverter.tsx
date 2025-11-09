
import React, { useState, useCallback, useRef } from 'react';
import { LoadingSpinner } from './icons';

interface ModalProps {
    onClose: () => void;
}

export const ExportManager: React.FC<ModalProps> = ({ onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>(['Gotowy do eksportu...']);
    const [device, setDevice] = useState('rekordbox_usb');

    const handleExport = () => {
        setIsLoading(true);
        setLogs(prev => [...prev, 'Rozpoczynanie eksportu...']);

        setTimeout(() => {
            setLogs(prev => [...prev, 'Krok 1/4: Analizowanie playlist...']);
            setTimeout(() => {
                setLogs(prev => [...prev, 'Krok 2/4: Kopiowanie plików audio...']);
                 setTimeout(() => {
                    setLogs(prev => [...prev, `Krok 3/4: Tworzenie bazy danych dla formatu ${device}...`]);
                     setTimeout(() => {
                        setLogs(prev => [...prev, 'Krok 4/4: Bezpieczne wysuwanie nośnika...']);
                        setIsLoading(false);
                        setLogs(prev => [...prev, 'Eksport zakończony pomyślnie!']);
                    }, 1000);
                }, 1200);
            }, 1000);
        }, 800);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100]">
            <div className="bg-[#16213e] rounded-2xl border border-cyan-400/30 p-6 w-full max-w-2xl flex flex-col gap-4 max-h-[90vh]">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-cyan-300 flex items-center gap-3"><i className="fa-solid fa-usb"></i>Menedżer Eksportu na USB</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-1">Wybierz playlisty</label>
                            <select multiple className="w-full h-32 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                <option>Deep House Set</option>
                                <option>Techno Warm-up</option>
                                <option>Podobne do "Deep Feelings"</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-1">Urządzenie docelowe</label>
                             <select value={device} onChange={e => setDevice(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                <option value="rekordbox_usb">CDJ/XDJ (Rekordbox USB)</option>
                                <option value="denon_prime">Denon Engine Prime</option>
                                <option value="generic_fat32">Generyczny USB (FAT32)</option>
                            </select>
                            <div className="mt-2 text-xs text-gray-400 p-2 bg-black/20 rounded">
                                <p><strong>Format:</strong> Zapewnia kompatybilność z Twoim sprzętem DJ-skim.</p>
                                <p><strong>Opcje:</strong> Utworzy odpowiednią strukturę folderów i pliki bazy danych.</p>
                            </div>
                        </div>
                    </div>
                     <div>
                         <h3 className="font-bold text-pink-400 mb-2">Dziennik operacji</h3>
                         <div className="bg-black/30 p-3 rounded-lg border border-gray-700 h-40 overflow-y-auto font-mono text-sm">
                            {logs.map((log, i) => <p key={i} className="text-gray-400 animate-fade-in">&gt; {log}</p>)}
                         </div>
                    </div>
                </div>
                 <div className="flex justify-end gap-4">
                     <button onClick={onClose} className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">Anuluj</button>
                     <button onClick={handleExport} disabled={isLoading} className="px-8 py-2 flex items-center justify-center gap-2 bg-gradient-to-r from-[#39ff14] to-[#00ff88] text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoading ? <LoadingSpinner className="w-5 h-5" /> : <i className="fa-solid fa-cogs"></i>}
                        <span>{isLoading ? 'Eksportowanie...' : 'Eksportuj'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

const XMLConverter: React.FC<ModalProps> = ({ onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [conversionResult, setConversionResult] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const dragCounter = useRef(0);

    const handleFileSelect = (selectedFile: File | null) => {
        if (selectedFile && selectedFile.type === 'text/xml') {
            setFile(selectedFile);
            setLogs([`Załadowano plik: ${selectedFile.name}`]);
            setConversionResult(null);
        } else {
            setLogs(['Błąd: Proszę wybrać prawidłowy plik XML.']);
        }
    };
    
    const handleDrag = useCallback((event: React.DragEvent<HTMLDivElement>, type: 'enter' | 'leave' | 'over') => {
        event.preventDefault();
        event.stopPropagation();
        if (type === 'enter') {
            dragCounter.current++;
            setIsDragging(true);
        } else if (type === 'leave') {
            dragCounter.current--;
            if (dragCounter.current === 0) setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;
        if (event.dataTransfer.files?.length > 0) {
            handleFileSelect(event.dataTransfer.files[0]);
            event.dataTransfer.clearData();
        }
    }, []);

    const handleConvert = () => {
        if (!file) return;
        setIsLoading(true);
        setConversionResult(null);
        setLogs(prev => [...prev, 'Rozpoczynanie konwersji...']);

        setTimeout(() => {
            setLogs(prev => [...prev, 'Krok 1/3: Analizowanie pliku źródłowego...']);
            setTimeout(() => {
                setLogs(prev => [...prev, 'Krok 2/3: Mapowanie pól na nowy format...']);
                setTimeout(() => {
                    setLogs(prev => [...prev, 'Krok 3/3: Generowanie pliku docelowego...']);
                    const mockResult = `<?xml version="1.0" encoding="UTF-8"?>
<DJ_PLAYLISTS Version="1.0">
    <PRODUCT Name="Lumbago Music AI" Version="1.0" />
    <COLLECTION Entries="1">
        <TRACK TrackID="1" Name="Converted Track" Artist="DJ Lumbago" Bpm="125.00">
            <LOCATION VOL="" DIR="/Converted/" FILE="track1.mp3"></LOCATION>
            <TEMPO Bpm="125.00" />
            <CUE_POINT Name="Hot Cue 1" Type="cue" Start="12.345" />
        </TRACK>
    </COLLECTION>
</DJ_PLAYLISTS>`;
                    setConversionResult(mockResult);
                    setIsLoading(false);
                    setLogs(prev => [...prev, 'Konwersja zakończona pomyślnie!']);
                }, 1200);
            }, 1000);
        }, 800);
    };
    
    const handleDownload = () => {
        if (!conversionResult || !file) return;
        const blob = new Blob([conversionResult], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.replace(/\.xml$/i, '_converted.xml');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100]">
            <div className="bg-[#16213e] rounded-2xl border border-cyan-400/30 p-6 w-full max-w-2xl flex flex-col gap-4 max-h-[90vh]">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-cyan-300 flex items-center gap-3"><i className="fa-solid fa-file-code"></i>Konwerter XML</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div 
                        className={`relative p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragging ? 'border-cyan-400 bg-cyan-900/20' : 'border-gray-600 hover:border-cyan-500'}`}
                        onDragEnter={e => handleDrag(e, 'enter')} onDragLeave={e => handleDrag(e, 'leave')}
                        onDragOver={e => handleDrag(e, 'over')} onDrop={handleDrop}
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        <i className="fa-solid fa-upload text-4xl text-gray-500 mb-2"></i>
                        <p className="text-gray-300">Przeciągnij i upuść plik XML tutaj</p>
                        <p className="text-sm text-gray-500">lub kliknij, aby wybrać</p>
                        <input id="file-input" type="file" accept=".xml,text/xml" className="hidden" onChange={e => handleFileSelect(e.target.files ? e.target.files[0] : null)} />
                    </div>

                    {file && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-300 mb-1">Format źródłowy</label>
                                <select className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                    <option>Rekordbox XML</option><option>VirtualDJ XML</option>
                                    <option>Traktor NML</option><option>Serato</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-bold text-gray-300 mb-1">Format docelowy</label>
                                <select className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                    <option>VirtualDJ XML</option><option>Rekordbox XML</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div>
                         <h3 className="font-bold text-pink-400 mb-2">Dziennik operacji</h3>
                         <div className="bg-black/30 p-3 rounded-lg border border-gray-700 h-40 overflow-y-auto font-mono text-sm">
                            {logs.map((log, i) => <p key={i} className="text-gray-400 animate-fade-in">&gt; {log}</p>)}
                         </div>
                    </div>
                </div>

                <div className="flex justify-between items-center gap-4">
                     <button onClick={handleConvert} disabled={!file || isLoading} className="w-1/2 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8ef0ff] to-[#ff66cc] text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoading ? <LoadingSpinner className="w-5 h-5" /> : <i className="fa-solid fa-cogs"></i>}
                        <span>{isLoading ? 'Konwertowanie...' : 'Konwertuj'}</span>
                    </button>
                    <button onClick={handleDownload} disabled={!conversionResult} className="w-1/2 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#39ff14] to-[#00ff88] text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                        <i className="fa-solid fa-download"></i> <span>Pobierz wynik</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default XMLConverter;