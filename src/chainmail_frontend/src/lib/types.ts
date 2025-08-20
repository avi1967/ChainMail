export type Mood = "NeedInspiration" | "WantToVent" | "LookingForMotivation";

export interface Geo {
  country: string;
  city?: string | null;
  lat: number;
  lng: number;
}

export interface Reply {
  message: string;
  created_at: bigint;
}

export interface LetterPublic {
  id: bigint;
  content: string;
  mood: Mood;
  geo: Geo;
  created_at: bigint;
  unlock_time: bigint;
  replies: Reply[];
  has_dm: boolean;
}

export interface DmMessage {
  message: string;
  created_at: bigint;
  author_tag: string;
}

export interface DmSession {
  id: bigint;
  letter_id: bigint;
  created_at: bigint;
  messages: DmMessage[];
}
