import { Deck } from "./deck";

export interface Quiz {
  id: string;
  startTime: Date;
  endTime: Date | null;
  timeLimit: Number;
  quizStatus: string;
  winner: string | null;
  isMultiple: Boolean;
  decks: Deck[]; 
}
