
import React from 'react';

interface HeaderProps {
    onOpenXmlConverter: () => void;
    onOpenExportManager: () => void;
}

const HeaderButton: React.FC<{ icon: string; label: string; onClick?: () => void; disabled?: boolean; }> = ({ icon, label, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#39ff14] to-[#00ff88] rounded-lg shadow-lg transform hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
    >
        <i className={`fa-solid ${icon}`}></i>
        <span>{label}</span>
    </button>
);


const Header: React.FC<HeaderProps> = ({ onOpenXmlConverter, onOpenExportManager }) => {
  return (
    <header className="p-4 sm:p-6 bg-black bg-opacity-30 rounded-2xl border border-cyan-400/20 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="text-center sm:text-left">
                <h1 className="text-3xl sm:text-4xl font-bold">
                  <span className="text-cyan-300" style={{ textShadow: '0 0 10px rgba(142, 240, 255, 0.5)' }}>Lumbago</span>
                  <span className="text-pink-400" style={{ textShadow: '0 0 10px rgba(255, 102, 204, 0.5)' }}> Music AI</span>
                </h1>
                <p className="text-cyan-200 text-sm sm:text-base">Inteligentny menedżer i analityk muzyki</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
                <HeaderButton icon="fa-upload" label="Importuj" disabled />
                <HeaderButton icon="fa-search" label="Skanuj" disabled />
                <HeaderButton icon="fa-tags" label="Taguj AI" disabled />
                <HeaderButton icon="fa-file-code" label="Konwertuj XML" onClick={onOpenXmlConverter} />
                <HeaderButton icon="fa-clone" label="Znajdź duplikaty" disabled />
                <HeaderButton icon="fa-pen-to-square" label="Zmień nazwy" disabled />
                <HeaderButton icon="fa-usb" label="Eksportuj na USB" onClick={onOpenExportManager} />
            </div>
        </div>
    </header>
  );
};

export default Header;