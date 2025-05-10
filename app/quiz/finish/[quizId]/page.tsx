"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Table, Button } from "antd";

/* ----- DTO returned by /statistics/quiz/{id} ----- */
interface StatsDTO {
    userId:           number;
    username:         string;
    quizId:           number;
    correctQuestions: number;
    numberOfAttempts: number;
    timeTakenSeconds: number;   // seconds, already final
}

/* row with composite score */
interface Row extends StatsDTO {
    composite: number;
}

/* ---------- composite scoring 0-1000 ---------- */
function computeScores(list: StatsDTO[]): Row[] {
    const maxCorrect = Math.max(...list.map(r => r.correctQuestions));
    const minAtt     = Math.min(...list.map(r => r.numberOfAttempts));
    const maxAtt     = Math.max(...list.map(r => r.numberOfAttempts));
    const minTime    = Math.min(...list.map(r => r.timeTakenSeconds));
    const maxTime    = Math.max(...list.map(r => r.timeTakenSeconds));

    const norm = (v: number, lo: number, hi: number, lowerBetter = false) =>
        hi === lo ? 1 : lowerBetter ? (hi - v) / (hi - lo) : (v - lo) / (hi - lo);

    return list
        .map(r => {
            const nCorrect = maxCorrect === 0 ? 0 : r.correctQuestions / maxCorrect;
            const nAtt     = norm(r.numberOfAttempts, minAtt, maxAtt, true);
            const nTime    = norm(r.timeTakenSeconds,  minTime, maxTime, true);

            const composite = Math.round(
                1000 * (0.5 * nCorrect + 0.3 * nAtt + 0.2 * nTime)
            );
            return { ...r, composite };
        })
        .sort((a, b) => b.composite - a.composite);      // best first
}

/* ---------------- React page ---------------- */
const FinishPage: React.FC = () => {
    const router              = useRouter();
    const { quizId }          = useParams<{ quizId: string }>();
    const qid                 = Number(quizId);
    const currentUid          = Number(localStorage.getItem("user_id"));
    const [rows, setRows]     = useState<Row[]>([]);

    /* 0️⃣ ─ Delete invite (only once, on mount) */
    useEffect(() => {
        const invId = localStorage.getItem("current_invitation_id");
        if (invId) {
            fetch(`http://localhost:8080/quiz/invitation/delete/${invId}`, {
                method: "DELETE"
            }).finally(() => localStorage.removeItem("current_invitation_id"));
        }
    }, []);

    /* 1️⃣ ─ Fetch raw stats once */
    useEffect(() => {
        if (!qid) return;
        (async () => {
            const res = await fetch(`http://localhost:8080/statistics/quiz/${qid}`);
            if (!res.ok) return;
            const raw: StatsDTO[] = await res.json();
            raw.forEach(r => {
                if (r.userId === currentUid) r.username = "YOU";
            });
            setRows(computeScores(raw));
        })();
    }, [qid, currentUid]);

    /* 2️⃣ ─ After rows ready mark winner/draw */
    useEffect(() => {
        if (rows.length === 0 || !qid) return;
        const winner =
            rows.length > 1 && rows[0].composite === rows[1].composite
                ? null
                : rows[0].userId;

        fetch(`http://localhost:8080/statistics/quiz/${qid}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ winnerUserId: winner })
        }).catch(() => {/* ignore */});
    }, [rows, qid]);

    return (
        <div style={{ padding: 24, maxWidth: 720 }}>
            <h1>Final results for quiz #{qid}</h1>

            <Table<Row>
                rowKey="userId"
                pagination={false}
                dataSource={rows}
                columns={[
                    { title: "Rank",        render: (_ , __ , i) => i + 1,            key: "rk" },
                    { title: "Player",      dataIndex: "username",                    key: "pl" },
                    { title: "Score (raw)", dataIndex: "correctQuestions",            key: "raw" },
                    { title: "Attempts",    dataIndex: "numberOfAttempts",            key: "att" },
                    { title: "Time (s)",    render: (_, r) => r.timeTakenSeconds.toFixed(1), key: "tm" },
                    { title: "Composite",   dataIndex: "composite",                   key: "cmp" }
                ]}
            />

            <Button style={{ marginTop: 24 }} onClick={() => router.push("/decks")}>
                Back to Decks
            </Button>
        </div>
    );
};

export default FinishPage;
