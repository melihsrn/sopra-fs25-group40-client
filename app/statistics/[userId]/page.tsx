//  app/statistics/[userId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Row, Col, Statistic, Progress, Table, Button } from "antd";

/* --------- raw DTO from /statistics/{userId} --------- */
interface StatRow {
    userId:           number;
    username:         string;
    quizId:           number;
    correctQuestions: number;
    numberOfAttempts: number;
    timeTakenSeconds: number;          // already in seconds
    isWinner:         boolean | null;  // true / false / null(draw)
}

/* ---------------- helper aggregations ---------------- */
function aggregate(rows: StatRow[]) {
    const totalQuizzes   = rows.length;
    const wins           = rows.filter(r => r.isWinner === true ).length;
    const draws          = rows.filter(r => r.isWinner === null).length;
    const losses         = totalQuizzes - wins - draws;

    const totalCorrect   = rows.reduce((s,r) => s + r.correctQuestions, 0);
    const totalAttempts  = rows.reduce((s,r) => s + r.numberOfAttempts , 0);
    const totalTime      = rows.reduce((s,r) => s + r.timeTakenSeconds, 0);

    const avgAcc         = totalAttempts === 0 ? 0 : totalCorrect / totalAttempts;
    const winRate        = totalQuizzes  === 0 ? 0 : wins / totalQuizzes;
    const avgTime        = totalQuizzes  === 0 ? 0 : totalTime / totalQuizzes;
    const avgAttempts    = totalQuizzes  === 0 ? 0 : totalAttempts / totalQuizzes;

    return {
        totalQuizzes, wins, losses, draws,
        totalCorrect, totalAttempts,
        avgAcc, winRate,
        avgTime, avgAttempts
    };
}

/* --------------- React component --------------- */
const UserStatsPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const uid        = Number(userId);
    const router     = useRouter();

    const [rows , setRows ] = useState<StatRow[] | null>(null);
    const [name , setName ] = useState<string>("");
    const [stats, setStats] = useState<ReturnType<typeof aggregate> | null>(null);

    /* fetch once */
    useEffect(() => {
        if (!uid) return;
        (async () => {
            const res = await fetch(`http://localhost:8080/statistics/${uid}`);
            if (res.ok) {
                const data: StatRow[] = await res.json();
                setRows(data);
                if (data.length) setName(data[0].username);
                setStats(aggregate(data));
            }
        })();
    }, [uid]);

    if (!rows || !stats)
        return <p style={{ padding: 24 }}>Loading statistics…</p>;

    /* ---------- OPTIONAL: tiny accuracy-over-time data ---------- */
    const accSeries = rows.map(r =>
        Number((r.correctQuestions / (r.numberOfAttempts || 1)).toFixed(3))
    );

    return (
        <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
            <h1>Statistics for <em>{name}</em></h1>

            {/* TOP CARD – totals */}
            <Card style={{ marginBottom: 24 }}>
                <Row gutter={32}>
                    <Col><Statistic title="Quizzes" value={stats.totalQuizzes} /></Col>
                    <Col><Statistic title="Wins"    value={stats.wins}          /></Col>
                    <Col><Statistic title="Losses"  value={stats.losses}        /></Col>
                    <Col><Statistic title="Draws"   value={stats.draws}         /></Col>
                </Row>
            </Card>

            {/* PROGRESS BARS */}
            <Card style={{ marginBottom: 24 }}>
                <Row gutter={32}>
                    <Col span={12}>
                        <h3>Win rate</h3>
                        <Progress
                            percent={ Number((stats.winRate * 100).toFixed(1)) }
                            status="active"
                        />
                    </Col>
                    <Col span={12}>
                        <h3>Average accuracy</h3>
                        <Progress
                            percent={ Number((stats.avgAcc * 100).toFixed(1)) }
                            status="active"
                        />
                    </Col>
                </Row>
            </Card>

            {/* OTHER AVERAGES */}
            <Card style={{ marginBottom: 24 }}>
                <Row gutter={32}>
                    <Col><Statistic title="Avg. attempts / quiz" value={stats.avgAttempts.toFixed(1)} /></Col>
                    <Col><Statistic title="Avg. time / quiz (s)" value={stats.avgTime   .toFixed(1)} /></Col>
                    <Col><Statistic title="Total correct answers" value={stats.totalCorrect}          /></Col>
                </Row>
            </Card>

            {/* ----- OPTIONAL tiny line-chart (accuracy vs quiz #) ----- */}
            {/* very small: no external chart lib – quick SVG */}
            <Card style={{ marginBottom: 24 }}>
                <h3>Accuracy over time</h3>
                <svg width="100%" height="120">
                    <polyline
                        fill="none"
                        stroke="#1677ff"
                        strokeWidth="2"
                        points={
                            accSeries.map((a,i) => `${20+i*40},${100 - a*90}`).join(" ")
                        }
                    />
                    {accSeries.map((a,i)=>(
                        <circle key={i} cx={20+i*40} cy={100 - a*90} r="3" fill="#1677ff"/>
                    ))}
                </svg>
            </Card>

            {/* DETAIL TABLE */}
            <Table<StatRow>
                rowKey="quizId"
                dataSource={rows}
                pagination={{ pageSize: 5 }}
                columns={[
                    { title: "Quiz ID",   dataIndex: "quizId", key: "id" },
                    { title: "Correct",   dataIndex: "correctQuestions" , key: "c" },
                    { title: "Attempts",  dataIndex: "numberOfAttempts" , key: "a" },
                    { title: "Accuracy",  render: (_,r)=>`${((r.correctQuestions/(r.numberOfAttempts||1))*100).toFixed(1)} %`, key:"ac"},
                    { title: "Time (s)",  dataIndex: "timeTakenSeconds" , key: "t" },
                    { title: "Result",    render: (_,r)=>
                            r.isWinner===null ? "Draw" : r.isWinner ? "Win" : "Loss", key:"res"}
                ]}
            />

            <Button style={{ marginTop: 32 }} onClick={() => router.push("/decks")}>
                Back to Decks
            </Button>
        </div>
    );
};

export default UserStatsPage;
