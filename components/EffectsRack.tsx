
import React from 'react';
import { EQBand } from '../types';

interface EffectsRackProps {
    effectsState: {
        eqBands: EQBand[];
        pitch: number;
        delay: { time: number; feedback: number; mix: number; };
        reverb: { mix: number; };
    };
    onEffectChange: (effect: string, value: any) => void;
}

const EffectSlider: React.FC<{ label: string; value: number; min: number; max: number; step: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onDoubleClick?: () => void; }> = ({ label, value, min, max, step, onChange, onDoubleClick }) => (
    <div className="flex flex-col space-y-1">
        <label className="text-xs text-gray-400 flex justify-between">
            <span>{label}</span>
            <span>{value.toFixed(2)}</span>
        </label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            onDoubleClick={onDoubleClick}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-sm"
        />
    </div>
);


const EffectsRack: React.FC<EffectsRackProps> = ({ effectsState, onEffectChange }) => {
    
    const handleEqChange = (index: number, gain: number) => {
        const newBands = [...effectsState.eqBands];
        newBands[index].gain = gain;
        onEffectChange('eqBands', newBands);
    };
    
    return (
        <div className="mt-4 space-y-6">
            <div>
                <h4 className="font-bold text-cyan-300 mb-2">Korektor (EQ)</h4>
                <div className="space-y-3 p-3 bg-black/20 rounded-lg">
                    <EffectSlider label="Bass" value={effectsState.eqBands[0].gain} min={-20} max={20} step={0.1} onChange={e => handleEqChange(0, parseFloat(e.target.value))} onDoubleClick={() => handleEqChange(0, 0)} />
                    <EffectSlider label="Mid" value={effectsState.eqBands[1].gain} min={-20} max={20} step={0.1} onChange={e => handleEqChange(1, parseFloat(e.target.value))} onDoubleClick={() => handleEqChange(1, 0)} />
                    <EffectSlider label="Treble" value={effectsState.eqBands[2].gain} min={-20} max={20} step={0.1} onChange={e => handleEqChange(2, parseFloat(e.target.value))} onDoubleClick={() => handleEqChange(2, 0)} />
                </div>
            </div>

            <div>
                <h4 className="font-bold text-cyan-300 mb-2">Prędkość / Tonacja</h4>
                <div className="space-y-3 p-3 bg-black/20 rounded-lg">
                     <EffectSlider label="Pitch" value={effectsState.pitch} min={0.5} max={2} step={0.01} onChange={e => onEffectChange('pitch', parseFloat(e.target.value))} onDoubleClick={() => onEffectChange('pitch', 1.0)} />
                </div>
            </div>

            <div>
                <h4 className="font-bold text-cyan-300 mb-2">Echo (Delay)</h4>
                <div className="space-y-3 p-3 bg-black/20 rounded-lg">
                    <EffectSlider label="Time" value={effectsState.delay.time} min={0} max={1} step={0.01} onChange={e => onEffectChange('delay.time', parseFloat(e.target.value))} onDoubleClick={() => onEffectChange('delay.time', 0)} />
                    <EffectSlider label="Feedback" value={effectsState.delay.feedback} min={0} max={0.9} step={0.01} onChange={e => onEffectChange('delay.feedback', parseFloat(e.target.value))} onDoubleClick={() => onEffectChange('delay.feedback', 0)} />
                    <EffectSlider label="Mix" value={effectsState.delay.mix} min={0} max={1} step={0.01} onChange={e => onEffectChange('delay.mix', parseFloat(e.target.value))} onDoubleClick={() => onEffectChange('delay.mix', 0)} />
                </div>
            </div>

             <div>
                <h4 className="font-bold text-cyan-300 mb-2">Pogłos (Reverb)</h4>
                 <div className="space-y-3 p-3 bg-black/20 rounded-lg">
                    <EffectSlider label="Mix" value={effectsState.reverb.mix} min={0} max={1} step={0.01} onChange={e => onEffectChange('reverb.mix', parseFloat(e.target.value))} onDoubleClick={() => onEffectChange('reverb.mix', 0)} />
                </div>
            </div>

        </div>
    );
};

export default EffectsRack;