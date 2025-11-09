
export interface CuePoint {
  time: number; // in seconds
  label: string;
}

export interface Track {
  id: number;
  title:string;
  artist: string;
  album: string;
  duration: number; // in seconds
  bpm: number | null;
  key: string | null;
  genre: string;
  year: number | null;
  coverArt: string;
  filePath: string;
  cues: CuePoint[];
  energy?: number;
  mood?: string;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: number[];
}

export type RuleField = 'title' | 'artist' | 'genre' | 'bpm' | 'key' | 'year';
export type RuleOperator = 'contains' | 'not_contains' | 'is' | 'is_not' | 'gt' | 'lt' | 'eq' | 'neq';

export interface RuleCondition {
  id: string;
  field: RuleField;
  operator: RuleOperator;
  value: string | number;
}

export interface SmartPlaylist {
  id: string;
  name: string;
  rules: RuleCondition[];
  matchType: 'all' | 'any';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface EQBand {
  frequency: number;
  gain: number;
  type: BiquadFilterType;
}

export interface FilterState {
  bpm: { min: number; max: number; };
  key: string;
  genre: string;
}

export interface WaveformSegment {
    type: 'bass' | 'percussion' | 'vocal' | 'break';
    percentage: number;
}