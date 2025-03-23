import { Deck } from "./deck";

export interface User {
  id: string | null;
  name: string | null;
  creationDate: Date;
  username: string | null;
  token: string | null;
  status: string | null;
  birthday: Date | null;
  decks: Deck | null; // list of all flashcards for the user
}
