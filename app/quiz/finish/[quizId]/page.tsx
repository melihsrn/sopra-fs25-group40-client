"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";
import { Button } from "antd";

export const dynamic = "force-dynamic";

interface PlayerProgress {
    userId: number;
    score: number;
    answeredQuestions: number;
}

interface QuizUpdateMessage {
    quizId: number;
    updateType: string; // "finished"
    totalQuestions: number;
    playerProgress: PlayerProgress[];
}

const QuizFinishPage: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const quizId = params.quizId as string;

    const [finalScore, setFinalScore] = useState<QuizUpdateMessage | null>(null);

    useEffect(() => {
        if (!quizId) return;

        const socket = new SockJS("http://localhost:8080/ws");
        const client = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log("[Finish WS]:", str),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log("Connected via WebSocket for final results");
                client.subscribe(`/topic/quizUpdates/${quizId}`, (frame: IMessage) => {
                    try {
                        const body: QuizUpdateMessage = JSON.parse(frame.body);
                        console.log("Received final quiz update:", body);
                        if (body.updateType === "finished") {
                            setFinalScore(body);
                        }
                    } catch (error) {
                        console.error("Error parsing final quiz update:", error);
                    }
                });
            },
        });
        client.activate();

        return () => {
            client.deactivate().catch(console.error);
        };
    }, [quizId]);

    return (
        <div style={{ padding: "20px" }}>
            <h1>Quiz Finished</h1>
            {finalScore ? (
                <div>
                    <p>
                        <strong>Total Questions:</strong> {finalScore.totalQuestions}
                    </p>
                    <h3>Final Scoreboard:</h3>
                    <ul>
                        {(finalScore.playerProgress ?? []).map((progress) => (
                            <li key={progress.userId}>
                                User {progress.userId}: {progress.answeredQuestions} answered, Score: {progress.score}
                            </li>
                        ))}
                    </ul>
                    <Button type="primary" onClick={() => router.push("/decks")}>
                        Back to Decks
                    </Button>
                </div>
            ) : (
                <p>Loading final results...</p>
            )}
        </div>
    );
};

export default QuizFinishPage;
