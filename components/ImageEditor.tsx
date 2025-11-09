
import React, { useState, useCallback } from 'react';
import { editImageWithAI } from '../services/geminiService';
import { LoadingSpinner } from './icons';

interface ImageEditorProps {
    imageUrl: string;
    onClose: () => void;
    onSave: (newImageUrl: string) => void;
}

const imageUrlToBase64 = async (url: string): Promise<{ base64: string; mimeType: string; }> => {
    const response = await fetch(url);
    const blob = await response.blob();
    const mimeType = blob.type;
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve({ base64, mimeType });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, onClose, onSave }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            setError('Wpisz polecenie, aby edytować obraz.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        try {
            const { base64, mimeType } = await imageUrlToBase64(imageUrl);
            const newImage = await editImageWithAI(base64, mimeType, prompt);
            if (newImage) {
                setGeneratedImage(newImage);
            } else {
                setError('Nie udało się wygenerować obrazu. Spróbuj ponownie.');
            }
        } catch (err) {
            console.error(err);
            setError('Wystąpił błąd podczas przetwarzania obrazu.');
        } finally {
            setIsLoading(false);
        }
    }, [prompt, imageUrl]);

    const handleSave = () => {
        if (generatedImage) {
            onSave(generatedImage);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100]">
            <div className="bg-[#16213e] rounded-2xl border border-cyan-400/30 p-6 w-full max-w-4xl flex flex-col gap-6 max-h-[90vh]">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-cyan-300">Edytor okładki AI</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>

                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
                    <div className="flex flex-col items-center gap-2">
                         <h3 className="font-bold text-pink-400">Oryginał</h3>
                         <img src={imageUrl} alt="Oryginalna okładka" className="w-full aspect-square rounded-lg object-cover" />
                    </div>
                     <div className="flex flex-col items-center gap-2">
                         <h3 className="font-bold text-pink-400">Wygenerowany</h3>
                         <div className="w-full aspect-square rounded-lg bg-black/30 flex items-center justify-center">
                            {isLoading ? (
                                <LoadingSpinner className="w-12 h-12 text-cyan-400" />
                            ) : generatedImage ? (
                                <img src={generatedImage} alt="Wygenerowana okładka" className="w-full h-full rounded-lg object-cover" />
                            ) : (
                                <p className="text-gray-500">Podgląd pojawi się tutaj</p>
                            )}
                         </div>
                    </div>
                </div>

                {error && <p className="text-red-500 text-center">{error}</p>}

                <div className="flex flex-col md:flex-row items-center gap-4">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="np. Dodaj filtr retro, zmień tło na kosmos..."
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        disabled={isLoading}
                    />
                    <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="w-full md:w-auto flex-shrink-0 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2">
                        {isLoading ? <LoadingSpinner className="w-5 h-5" /> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                        <span>Generuj</span>
                    </button>
                </div>
                 <div className="flex justify-end gap-4">
                     <button onClick={onClose} className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">Anuluj</button>
                     <button onClick={handleSave} disabled={!generatedImage || isLoading} className="px-6 py-2 bg-gradient-to-r from-[#39ff14] to-[#00ff88] text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                        Zapisz i użyj
                    </button>
                 </div>
            </div>
        </div>
    );
};

export default ImageEditor;