
import React, { useState, useRef, useCallback } from 'react';
// Fix: LiveSession is not an exported member. Modality is imported for config.
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

const AudioTranscriber: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Fix: Replaced LiveSession with `any` since it is not an exported type.
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const stopListening = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsListening(false);
    }, []);

    const startListening = async () => {
        setError(null);
        setTranscription('');
        setIsListening(true);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        console.log('Połączenie otwarte.');
                        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        
                        mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
                        scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current.destination);
                    },
                    onmessage: (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            setTranscription(prev => prev + message.serverContent.inputTranscription.text);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Błąd połączenia:', e);
                        setError('Wystąpił błąd połączenia z serwerem AI.');
                        stopListening();
                    },
                    onclose: () => {
                        console.log('Połączenie zamknięte.');
                        if (isListening) stopListening();
                    },
                },
                // Fix: The Live API requires responseModalities to be set.
                config: {
                    inputAudioTranscription: {},
                    responseModalities: [Modality.AUDIO],
                },
            });
        } catch (err) {
            console.error('Błąd dostępu do mikrofonu:', err);
            setError('Nie udało się uzyskać dostępu do mikrofonu. Sprawdź uprawnienia w przeglądarce.');
            setIsListening(false);
        }
    };
    
    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <div className="bg-black bg-opacity-30 p-4 rounded-xl border border-cyan-400/20 mt-6">
            <h3 className="text-lg font-bold text-cyan-300 mb-2">Transkrypcja na żywo</h3>
            <p className="text-sm text-gray-400 mb-4">Naciśnij przycisk i mów do mikrofonu, aby zobaczyć transkrypcję w czasie rzeczywistym.</p>
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleListening}
                    className={`px-4 py-2 rounded-lg text-white font-bold transition-all w-32 ${
                        isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                    {isListening ? <><i className="fa-solid fa-stop mr-2"></i>Stop</> : <><i className="fa-solid fa-microphone mr-2"></i>Start</>}
                </button>
                 {isListening && <div className="text-green-400 flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    Nasłuchiwanie...
                </div>}
            </div>
            {error && <p className="text-red-500 mt-4">{error}</p>}
            <div className="mt-4 p-3 bg-black/30 rounded-lg min-h-24 border border-gray-700">
                <p className="text-gray-300 whitespace-pre-wrap">{transcription || '...'}</p>
            </div>
        </div>
    );
};

export default AudioTranscriber;