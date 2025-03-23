import { Deck } from "./deck";

export interface Flashcard {
    id: string;
    description: string | null;
    date: Date;
    answer: string;
    wrongAnswers: string[];
    imageUrl: string | null;
    isPublic: boolean ;
    flashcardCategory: string;
    deck: Deck;
  } 
  