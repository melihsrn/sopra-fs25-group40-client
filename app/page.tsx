"use client";
import "@ant-design/v5-patch-for-react-19";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import styles from "@/styles/page.module.css";

export default function Home() {
  const router = useRouter();
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Welcome to MemoryDeck</h1>
        <p>Preserve Your Stories. Relive Your Moments. Stay Connected.</p>
        <ol>
          <li>
            Create <strong>Memory Decks</strong> — upload photos, add captions, and document the stories behind each moment.
          </li>
          <li>
            Answer meaningful prompts and questions that spark deeper reflection and conversation.
          </li>
          <li>
            Invite family members or caregivers to contribute and collaborate on shared memories.
          </li>
          <li>
            Use MemoryDeck as a personal journal, a family archive, or a cognitive tool to revisit and review your life’s moments.
          </li>
          <li>
            Every story matters — let’s make sure they are remembered for generations to come.
          </li>
        </ol>

        <div className={styles.ctas}>
          <Button
            type="primary"
            onClick={() => router.push("/login")}
          >
            Start Your Memory Journey
          </Button>
        </div>
      </main>
      {/* <footer className={styles.footer}>
        <Button
          type="link"
          icon={<BookOutlined />}
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn
        </Button>
        <Button
          type="link"
          icon={<CodeOutlined />}
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Examples
        </Button>
        <Button
          type="link"
          icon={<GlobalOutlined />}
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Go to nextjs.org →
        </Button>
      </footer> */}
    </div>
  );
}
