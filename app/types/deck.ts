import { Flashcard } from "./flashcard";
import { Quiz } from "./quiz";
import { User } from "./user";

export interface Deck {
    id: string;
    title: string | null;
    flashcards: Flashcard | null;
    deckCategory: string;
    isPublic: boolean ;
    user: User;
    quiz: Quiz;
  } 
  