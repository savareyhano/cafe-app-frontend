export type Language = 'en' | 'id';

export interface Activity {
  id: string;
  title: { en: string; id: string };
  description: { en: string; id: string };
  category: 'nature' | 'mindfulness' | 'art' | 'business' | 'community';
  image: string;
  duration: string;
  intensity: { en: string; id: string };
}

export interface ConsultationTopic {
  id: string;
  title: { en: string; id: string };
  description: { en: string; id: string };
  mentorName: string;
  mentorRole: { en: string; id: string };
  mentorImage: string;
}

export interface EventItem {
  id: string;
  title: { en: string; id: string };
  date: string;
  time: string;
  image: string;
  slotsLeft: number;
  price: string;
  category: string;
}

export interface Spot {
  id: string;
  name: { en: string; id: string };
  description: { en: string; id: string };
  image: string;
}

export interface MenuProduct {
  id: string;
  name: string;
  category: 'coffee' | 'artisan' | 'bites' | 'signature';
  price: string;
  description: { en: string; id: string };
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}
