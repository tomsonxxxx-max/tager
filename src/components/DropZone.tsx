
import React from 'react';

const DropZone: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101] pointer-events-none">
            <div className="w-11/12 h-5/6 border-4 border-dashed border-cyan-400 rounded-2xl flex flex-col items-center justify-center text-center p-4">
                <i className="fa-solid fa-file-audio text-5xl sm:text-7xl text-cyan-400 mb-6 animate-bounce"></i>
                <h2 className="text-2xl sm:text-4xl font-bold text-white">Upuść pliki audio tutaj</h2>
                <p className="text-md sm:text-lg text-gray-300 mt-2">Zostaną dodane do Twojej biblioteki</p>
            </div>
        </div>
    );
};

export default DropZone;