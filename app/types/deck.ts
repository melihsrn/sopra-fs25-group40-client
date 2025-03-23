import { Flashcard } from "./flashcard";
import { User } from "./user";

export interface Deck {
    id: string;
    title: string | null;
    flashcards: Flashcard | null;
    deckCategory: string;
    isPublic: boolean ;
    user: User;
  } 
  