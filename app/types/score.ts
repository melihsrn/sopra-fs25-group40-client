import { User } from "./user";
import { Quiz } from "./quiz";

export interface Score {
  id: string;
  quiz: Quiz;
  user: User;
  correctQuestions: Number | null;
  totalQuestions: Number | null; 
}
