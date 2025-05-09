import { Deck } from "./deck";
import { Invitation } from "./invitation";
import { Score } from "./score";

export interface Quiz {
  id: string;
  startTime: Date;
  endTime: Date | null;
  timeLimit: Number;
  quizStatus: string;
  winner: string | null;
  isMultiple: Boolean;
  decks: Deck[]; 
  scores: Score[];
  invitation: Invitation;
}
