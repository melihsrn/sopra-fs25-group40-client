import { Deck } from "./deck";

export interface Invitation {
  id: string;
  quizId: string;
  fromUserId: string;
  toUserId: string;
  decks: Deck[] | null;
  timeLimit: Number;
}
