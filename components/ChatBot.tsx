
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, GroundingChunk } from '../types';
import { sendMessageToChat, getUpToDateInfo } from '../services/geminiService';
import { LoadingSpinner } from './icons';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let responseText = '';
    let sources: GroundingChunk[] = [];
    
    if (useSearch) {
        const result = await getUpToDateInfo(input);
        responseText = result.text;
        sources = result.sources;
    } else {
        responseText = await sendMessageToChat(input);
    }
    
    let modelMessageText = responseText;
    if (sources.length > 0) {
        modelMessageText += '\n\nŹródła:\n' + sources
            .map((s, i) => `${i+1}. [${s.web?.title || 'Link'}](${s.web?.uri})`)
            .join('\n');
    }

    const modelMessage: ChatMessage = { role: 'model', text: modelMessageText };
    setMessages(prev => [...prev, modelMessage]);
    setIsLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 bg-gradient-to-br from-pink-500 to-purple-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-3xl z-50 transform hover:scale-110 transition-transform"
        aria-label="Otwórz chatbota"
      >
        <i className="fa-solid fa-comments"></i>
      </button>
      
      {isOpen && (
        <div className="fixed bottom-44 right-6 w-full max-w-sm h-[60vh] bg-[#16213e] rounded-2xl shadow-2xl flex flex-col z-50 border border-cyan-400/30">
          <header className="p-4 bg-black/30 rounded-t-2xl border-b border-cyan-400/20 flex justify-between items-center">
            <h3 className="font-bold text-lg text-cyan-300">Asystent AI</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
          </header>

          <div className="flex-grow p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
                   <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-xs md:max-w-md p-3 rounded-lg bg-gray-700 flex items-center">
                    <LoadingSpinner className="w-5 h-5" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 bg-black/30 rounded-b-2xl border-t border-cyan-400/20">
            <div className="flex items-center justify-center mb-2">
                <label className="flex items-center cursor-pointer text-sm text-gray-400">
                    <input type="checkbox" checked={useSearch} onChange={() => setUseSearch(!useSearch)} className="form-checkbox h-4 w-4 text-cyan-500 bg-gray-800 border-gray-600 rounded focus:ring-cyan-600"/>
                    <span className="ml-2">Użyj Google Search</span>
                </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Zapytaj o coś..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button onClick={handleSend} disabled={isLoading} className="bg-cyan-500 text-white p-2 rounded-lg hover:bg-cyan-400 disabled:opacity-50">
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;