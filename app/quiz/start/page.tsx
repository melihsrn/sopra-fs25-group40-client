"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Form, InputNumber, Select, Switch, Input, message as antdMessage } from "antd";
import { useApi } from "@/hooks/useApi";
import { Deck } from "@/types/deck";

export const dynamic = "force-dynamic"; // avoids SSR issues

interface Quiz {
    id: number;
    // any other fields returned by /quiz/start
}

const { Option } = Select;

const QuizStartPage: React.FC = () => {
    const router = useRouter();
    const api = useApi();
    const [decks, setDecks] = useState<Deck[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // Form state
    const [selectedDeck, setSelectedDeck] = useState<number | null>(null);
    const [numberOfQuestions, setNumberOfQuestions] = useState<number>(5);
    const [timeLimit, setTimeLimit] = useState<number>(300);
    const [isMultiplayer, setIsMultiplayer] = useState<boolean>(false);
    const [inviteeId, setInviteeId] = useState<number | null>(null);

    useEffect(() => {
        const userId = localStorage.getItem("user_id");
        if (userId) {
            api
                .get<Deck[]>(`/decks?userId=${userId}`)
                .then((data) => setDecks(data))
                .catch((err) => console.error(err));
        }
    }, [api]);

    const handleStartQuiz = async () => {
        if (!selectedDeck) {
            antdMessage.error("Please select a deck");
            return;
        }
        setLoading(true);
        try {
            // 1) Create the quiz
            const payload = {
                deckId: selectedDeck,
                numberOfQuestions,
                timeLimit,
                isMultiple: isMultiplayer,
            };
            // typed response
            const quiz = await api.post<Quiz>("/quiz/start", payload);
            const quizId = quiz.id;

            // 2) If multiplayer, optionally invite
            if (isMultiplayer && inviteeId) {
                const userId = localStorage.getItem("user_id");
                if (!userId) {
                    antdMessage.error("Please log in first.");
                    setLoading(false);
                    return;
                }
                await api.post("/invitations/send", {
                    inviterId: parseInt(userId, 10),
                    inviteeId,
                    quizId,
                });
                antdMessage.success("Invitation sent!");
            }

            // 3) Go to quiz session
            router.push(`/quiz/${quizId}`);
        } catch (err) {
            console.error(err);
            antdMessage.error("Failed to start quiz");
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: "20px" }}>
            <h1>Configure Quiz</h1>
            <Form layout="vertical" onFinish={handleStartQuiz}>
                <Form.Item label="Select Deck" required>
                    <Select
                        placeholder="Select a deck"
                        onChange={(value: number) => setSelectedDeck(value)}
                    >
                        {decks.map((deck) => (
                            <Option key={deck.id} value={deck.id}>
                                {deck.title}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item label="Number of Questions" required>
                    <InputNumber
                        min={1}
                        max={50}
                        value={numberOfQuestions}
                        onChange={(value) => setNumberOfQuestions(value || 5)}
                    />
                </Form.Item>
                <Form.Item label="Time Limit (seconds)" required>
                    <InputNumber
                        min={30}
                        max={3600}
                        value={timeLimit}
                        onChange={(value) => setTimeLimit(value || 300)}
                    />
                </Form.Item>
                <Form.Item label="Multiplayer">
                    <Switch
                        checked={isMultiplayer}
                        onChange={(checked) => setIsMultiplayer(checked)}
                    />
                </Form.Item>

                {isMultiplayer && (
                    <Form.Item label="Invite Opponent (User ID)">
                        <Input
                            type="number"
                            placeholder="Enter opponent's user ID"
                            onChange={(e) => setInviteeId(parseInt(e.target.value, 10))}
                        />
                    </Form.Item>
                )}

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Start Quiz
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default QuizStartPage;
