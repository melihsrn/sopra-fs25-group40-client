"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, Radio, message as antdMessage, Table, Progress } from "antd";

export const dynamic = "force-dynamic";

/* ────────── DTOs from backend ────────── */
interface FlashcardDTO {
    id: number;
    description: string;
    answer: string;
    wrongAnswers: string[];
}

interface AnswerResponseDTO {
    wasCorrect: boolean;
    finished: boolean;
    nextQuestion: FlashcardDTO | null;
}

/* score entry returned by GET /quiz/status/{id} */
interface ScoreDTO {
    id: number;                // userId
    correctQuestions: number;
    totalQuestions: number;
}

interface QuizStatusDTO {
    quizStatus: "WAITING" | "IN_PROGRESS" | "COMPLETED";
    timeLimit: number;
    scores: ScoreDTO[];
}

/* row we display in the table */
interface ScoreRow {
    userId: number;
    name: string;
    correct: number;
    total: number;
}

/* ────────── Component ────────── */
const QuizSessionPage: React.FC = () => {
    const router = useRouter();

    const [quizId, setQuizId] = useState<number | null>(null);

    /* question state */
    const [currentQuestion, setCurrentQuestion] = useState<FlashcardDTO | null>(null);
    const [options, setOptions] = useState<string[]>([]);
    const [selectedOption, setSelectedOption] = useState<string>("");

    /* flags */
    const [iAmFinished, setIAmFinished] = useState(false);
    const [quizFinishedForAll, setQuizFinishedForAll] = useState(false);

    /* timer */
    const [elapsedSec, setElapsedSec] = useState(0);
    const totalSecondsRef = useRef<number | null>(null);

    /* scoreboard */
    const [rows, setRows] = useState<ScoreRow[]>([]);

    /* simple username cache */
    const nameCache = useRef<Record<number, string>>({});

    const uid = Number(localStorage.getItem("user_id"));
    const shuffle = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5);
    const err     = (e: unknown) => (e instanceof Error ? e : new Error(String(e)));

    /* parse [quizId] from URL */
    useEffect(() => {
        const p = window.location.pathname.split("/");
        if (p.length >= 3) setQuizId(Number(p[2]));
    }, []);

    /* ───────────────────── fetch first question ───────────────────── */
    async function loadCurrentQuestion() {
        if (!quizId) return;
        try {
            const res = await fetch(
                `http://localhost:8080/quiz/${quizId}/currentQuestion?userId=${uid}`
            );
            if (!res.ok) throw err(await res.text());
            const q: FlashcardDTO = await res.json();
            setCurrentQuestion(q);
            setOptions(shuffle([q.answer, ...q.wrongAnswers]));
            setSelectedOption("");
            setIAmFinished(false);
        } catch (e) {
            const m = err(e).message;
            if (m.includes("already finished")) setIAmFinished(true);
            else antdMessage.error(m);
        }
    }
    useEffect(() => {
        if (quizId) loadCurrentQuestion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quizId]);

    /* ───────────────────── poll quiz status every 1 s ───────────────────── */
    useEffect(() => {
        if (!quizId) return;

        async function poll() {
            try {
                const res = await fetch(`http://localhost:8080/quiz/status/${quizId}`);
                if (!res.ok) return;
                const st: QuizStatusDTO = await res.json();

                /* set timer once */
                if (totalSecondsRef.current === null && st.timeLimit > 0)
                    totalSecondsRef.current = st.timeLimit + 1;  // One additional second for safety

                /* transform scores → table rows */
                const r: ScoreRow[] = await Promise.all(
                    st.scores.map(async (sc) => {
                        if (!nameCache.current[sc.id]) {
                            try {
                                const uRes = await fetch(`http://localhost:8080/users/${sc.id}`);
                                if (uRes.ok) {
                                    const u = await uRes.json();
                                    nameCache.current[sc.id] = u.username;
                                }
                            } catch {/* ignore */}
                        }
                        return {
                            userId:  sc.id,
                            name:    sc.id === uid ? "YOU" : nameCache.current[sc.id] ?? sc.id.toString(),
                            correct: sc.correctQuestions,
                            total:   sc.totalQuestions
                        };
                    })
                );
                setRows(r);

                if (st.quizStatus === "COMPLETED") setQuizFinishedForAll(true);
            } catch { /* ignore */ }
        }

        poll();
        const id = setInterval(poll, 1000);
        return () => clearInterval(id);
    }, [quizId, uid]);

    /* timer tick */
    useEffect(() => {
        const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
        return () => clearInterval(id);
    }, []);

    /* redirect when done or time expired */
    useEffect(() => {
        const timeUp =
            totalSecondsRef.current !== null &&
            elapsedSec >= totalSecondsRef.current;

        if (timeUp && !iAmFinished) {
            // tell backend we’re done because of time-out
            sendTimeoutAnswer().then(() => setIAmFinished(true));
        }

        if ((quizFinishedForAll || timeUp) && quizId) {
            router.push(`/quiz/finish/${quizId}`);
        }
    }, [quizFinishedForAll, elapsedSec, quizId, router]);

    /* ───────────────────── submit answer ───────────────────── */
    async function handleSubmitAnswer() {
        if (!currentQuestion) return antdMessage.error("No question.");
        if (!selectedOption)  return antdMessage.error("Pick an option.");

        try {
            const payload = {
                quizId,
                flashcardId: currentQuestion.id,
                selectedAnswer: selectedOption,
                userId: uid
            };
            const res = await fetch("http://localhost:8080/quiz/answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw err(await res.text());
            const dto: AnswerResponseDTO = await res.json();

            dto.wasCorrect ? antdMessage.success("Correct!") : antdMessage.error("Wrong!");
            if (dto.finished) {
                setIAmFinished(true);
                antdMessage.info("You finished! Waiting for opponent…");
            }
            if (dto.nextQuestion) {
                setCurrentQuestion(dto.nextQuestion);
                setOptions(shuffle([
                    dto.nextQuestion.answer,
                    ...dto.nextQuestion.wrongAnswers
                ]));
                setSelectedOption("");
            }
        } catch (e) {
            antdMessage.error(err(e).message);
        }
    }

    /* ───────────────────── UI ───────────────────── */
    const timerPercent =
        totalSecondsRef.current != null
            ? (elapsedSec / totalSecondsRef.current) * 100
            : 0;

    async function sendTimeoutAnswer() {
        if (!quizId || !currentQuestion) return;
        const payload = {
            quizId,
            flashcardId: currentQuestion.id, // still tell the server which Q we were on
            selectedAnswer: null,            // <-- timeout flag
            userId: uid
        };
        await fetch("http://localhost:8080/quiz/answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }).catch(() => {});                // ignore network errors for timeout call
    }



    return (
        <div style={{ padding: 20, maxWidth: 600 }}>
            <h1>Quiz #{quizId}</h1>

            {totalSecondsRef.current !== null && (
                <Progress
                    percent={Math.min(100, timerPercent)}
                    status={elapsedSec >= (totalSecondsRef.current ?? 0) ? "exception" : "active"}
                    showInfo={false}
                />
            )}

            {iAmFinished ? (
                <p>You’re done! Waiting for your opponent…</p>
            ) : currentQuestion ? (
                <>
                    <h3>{currentQuestion.description}</h3>
                    <Radio.Group
                        onChange={(e) => setSelectedOption(e.target.value)}
                        value={selectedOption}
                    >
                        {options.map((o, i) => (
                            <Radio key={i} value={o} style={{ display: "block" }}>
                                {o}
                            </Radio>
                        ))}
                    </Radio.Group>
                    <Button type="primary" onClick={handleSubmitAnswer} style={{ marginTop: 16 }}>
                        Submit
                    </Button>
                </>
            ) : (
                <p>Loading question…</p>
            )}

            {rows.length > 0 && (
                <Table<ScoreRow>
                    style={{ marginTop: 24 }}
                    size="small"
                    pagination={false}
                    dataSource={rows}
                    rowKey="userId"
                    columns={[
                        { title: "Player",   dataIndex: "name",    key: "p" },
                        { title: "Progress", render: (_,_r)=>`${_r.correct}/${_r.total}`, key: "pr" }
                    ]}
                />
            )}

            <Button onClick={() => router.push("/decks")} style={{ marginTop: 20 }}>
                Back to Decks
            </Button>
        </div>
    );
};

export default QuizSessionPage;
