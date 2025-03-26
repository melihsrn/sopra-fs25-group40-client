import { Deck } from "./deck";
import { Score } from "./score";

export interface User {
  id: string;
  name: string | null;
  creationDate: Date;
  username: string;
  token: string | null;
  status: string;
  birthday: Date | null;
  decks: Deck[] | null;
  scores: Score[] | null;
  fcmToken: string | null;
}
