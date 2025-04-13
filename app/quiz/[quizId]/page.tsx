"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Radio, message as antdMessage } from "antd";

export const dynamic = "force-dynamic";

interface AnswerResponseDTO {
    wasCorrect: boolean;
    finished: boolean;
    nextQuestion: FlashcardDTO | null;
}

interface FlashcardDTO {
    id: number;
    description: string;
    answer: string;
    wrongAnswers: string[];
}

const QuizSessionPage: React.FC = () => {
    const router = useRouter();

    const [quizId, setQuizId] = useState<string>("");
    const [currentQuestion, setCurrentQuestion] = useState<FlashcardDTO | null>(null);
    const [options, setOptions] = useState<string[]>([]);
    const [selectedOption, setSelectedOption] = useState<string>("");
    const [isUserFinished, setIsUserFinished] = useState<boolean>(false);

    // Helper: Wrap errors so that error.message is always defined.
    function wrapError(error: unknown): Error {
        return error instanceof Error ? error : new Error(String(error));
    }

    // Helper: Shuffle an array
    function shuffleArray(arr: string[]): string[] {
        const array = [...arr];
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Parse quizId from the URL path
    useEffect(() => {
        const parts = window.location.pathname.split("/");
        if (parts.length >= 3) {
            setQuizId(parts[2]);
        }
    }, []);

    // Fetch the user's current question from the backend
    async function fetchFirstQuestion() {
        const uid = localStorage.getItem("user_id");
        if (!uid) {
            antdMessage.error("No user ID found. Please log in.");
            return;
        }
        try {
            const url = `http://localhost:8080/quiz/${quizId}/currentQuestion?userId=${uid}`;
            const res = await fetch(url);
            if (!res.ok) {
                const bodyText = await res.text();
                throw new Error(`Server responded with ${res.status}\n${bodyText}`);
            }
            const question: FlashcardDTO = await res.json();
            setIsUserFinished(false);
            setCurrentQuestion(question);
            const combined = shuffleArray([question.answer, ...question.wrongAnswers]);
            setOptions(combined);
            setSelectedOption("");
        } catch (error) {
            const e = wrapError(error);
            console.error("fetchFirstQuestion error:", e.message);
            if (e.message.includes("You have already finished this quiz")) {
                antdMessage.info("You have already finished. Waiting for opponent or final results...");
                setIsUserFinished(true);
            } else if (e.message.includes("No more questions")) {
                antdMessage.info("No more questions. Possibly waiting for others...");
                setIsUserFinished(true);
            } else if (e.message.includes("Quiz is not in progress yet")) {
                antdMessage.info("Quiz not started yet. Waiting for the other player to join...");
            } else {
                antdMessage.error(e.message);
            }
        }
    }

    // On quizId update, fetch the first question
    useEffect(() => {
        if (quizId) {
            fetchFirstQuestion();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quizId]);

    // Submit the answer to /quiz/answer endpoint
    async function handleSubmitAnswer() {
        const uid = localStorage.getItem("user_id");
        if (!uid) {
            antdMessage.error("No user ID found. Please log in.");
            return;
        }
        if (!currentQuestion) {
            antdMessage.error("No current question available.");
            return;
        }
        if (!selectedOption) {
            antdMessage.error("Please pick an option first.");
            return;
        }

        try {
            const payload = {
                quizId: parseInt(quizId, 10),
                flashcardId: currentQuestion.id,
                selectedAnswer: selectedOption,
                userId: parseInt(uid, 10)
            };
            const res = await fetch("http://localhost:8080/quiz/answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const bodyText = await res.text();
                throw new Error(`Server responded with ${res.status}\n${bodyText}`);
            }
            const answerResponse: AnswerResponseDTO = await res.json();
            if (answerResponse.wasCorrect) {
                antdMessage.success("Correct!");
            } else {
                antdMessage.error("Wrong!");
            }
            if (answerResponse.finished) {
                setIsUserFinished(true);
                antdMessage.info("You have finished the quiz! Waiting for the other player...");
            } else if (answerResponse.nextQuestion) {
                setCurrentQuestion(answerResponse.nextQuestion);
                const combined = shuffleArray([
                    answerResponse.nextQuestion.answer,
                    ...answerResponse.nextQuestion.wrongAnswers
                ]);
                setOptions(combined);
                setSelectedOption("");
            } else {
                antdMessage.info("No more questions. Possibly waiting for others...");
                setIsUserFinished(true);
            }
        } catch (error) {
            const e = wrapError(error);
            console.error("handleSubmitAnswer error:", e.message);
            antdMessage.error(e.message);
        }
    }

    return (
        <div style={{ padding: 20 }}>
            <h1>Quiz Session: {quizId}</h1>
            {isUserFinished ? (
                <p>Waiting for the other player to finish...</p>
            ) : currentQuestion ? (
                <div style={{ border: "1px solid #ccc", padding: 16 }}>
                    <h3>Question:</h3>
                    <p>{currentQuestion.description}</p>
                    <div style={{ marginTop: 10 }}>
                        <Radio.Group onChange={(e) => setSelectedOption(e.target.value)} value={selectedOption}>
                            {options.map((option, idx) => (
                                <Radio key={idx} value={option}>
                                    {option}
                                </Radio>
                            ))}
                        </Radio.Group>
                    </div>
                    <Button type="primary" onClick={handleSubmitAnswer} style={{ marginTop: 16 }}>
                        Submit
                    </Button>
                </div>
            ) : (
                <p>No current question loaded. Possibly the quiz hasn't started or has ended.</p>
            )}
            <Button onClick={() => router.push("/decks")} style={{ marginTop: 20 }}>
                Back to Decks
            </Button>
        </div>
    );
};

export default QuizSessionPage;
