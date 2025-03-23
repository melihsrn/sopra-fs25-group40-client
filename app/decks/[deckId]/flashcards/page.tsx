"use client";

import React, { useEffect, useState } from "react";
import { useRouter,useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { Flashcard } from "@/types/flashcard";
import { Button, Carousel } from "antd";
import { EditOutlined,DeleteOutlined } from "@ant-design/icons";
import "@/styles/FlashcardCarousel.css"; // Optional: for custom styles
import { getApiDomain } from "@/utils/domain";
import Image from "next/image";

const FlashcardsPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { deckId } = useParams();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null); // Tracks flipped flashcard

  const apiUrl = getApiDomain();
  const [deckIdAsNumber, setDeckIdAsNumber] = useState<number | null>(null);

  useEffect(() => {
    if (deckId) {
      const parsedDeckId = Number(deckId);
      if (!isNaN(parsedDeckId)) {
        setDeckIdAsNumber(parsedDeckId);
      }
    }
  }, []);

  useEffect(() => {
    const checkLogged = async () => {
      const token = localStorage.getItem("token");
      if (!token || token === "null") {
        router.push("/login");
      }
    };

    checkLogged();
    const interval = setInterval(checkLogged, 5000);
    return () => clearInterval(interval);
  }, [router]);



  useEffect(() => {
    const fetchCards = async () => {
        try {
          const fetchedFlashcards = await apiService.get<Flashcard[]>(`/decks/${deckId}/flashcards`);
          setFlashcards(fetchedFlashcards);

        } catch (error) {
            alert("Error fetching flashcards");
            console.error(error);
        }
    };

    if (deckIdAsNumber !== null) {
      fetchCards();
    }
}, [apiService, deckIdAsNumber]); 

  const handleEdit = (flashcardId: string | null) => {
    router.push(`/decks/${deckId}/flashcards/${flashcardId}`);
  };

  const handleDelete = async (flashcardId: string) => {
    await apiService.delete(`/decks/${deckId}/flashcards/${flashcardId}`);
    setFlashcards((flashcards) =>
      flashcards.filter((flashcard) => flashcard.id !== flashcardId)
    );
  };

  const toggleFlip = (index: number) => {
    setFlippedIndex(flippedIndex === index ? null : index);
  };

  return (
    <div className="flashcard-carousel-container">
        <Button
        type="primary"
        style={{ marginBottom: "20px" }}
        onClick={() => router.push(`/decks/${deckId}/flashcards/addFlashcard`)}
      >
        Add New Flashcard
      </Button>

      <Carousel arrows infinite={false}>
        {flashcards.map((flashcard, index) => (
          <div key={flashcard.id} className="flashcard-wrapper">
            <div
              className={`flashcard ${flippedIndex === index ? "flipped" : ""}`}
              onClick={() => toggleFlip(index)}
            >
              {/* Front Side */}
              <div className="flashcard-front">
                { (Number(flashcard.deck.id) === deckIdAsNumber) &&(
                <div className="flashcard-header">
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    className="edit-button"
                    onClick={(e) => {
                      e.stopPropagation(); // prevent flipping on edit click
                      handleEdit(flashcard.id);
                    }}
                  />
                </div>
                )}

                { (Number(flashcard.deck.id) === deckIdAsNumber) && (
                  <div className="flashcard-footer">
                  <Button
                    type="link"
                    icon={<DeleteOutlined />}
                    className="delete-button"
                    style={{color: "#ff4000" }}
                    onClick={(e) => {
                      e.stopPropagation(); // prevent flipping on edit click
                      handleDelete(flashcard.id);
                    }}
                  />
                </div>)}
                
                <div className="flashcard-content">
                  <p>{flashcard.description}</p>
                  <p>{flashcard.flashcardCategory}</p>
                  {(flashcard.date !== null) && (<p>Date: {new Date(flashcard.date).toLocaleDateString()}</p>)}
                  {flashcard.imageUrl && <Image src={`${apiUrl}/flashcards/image?imageUrl=${encodeURIComponent(flashcard.imageUrl)}`} alt="Flashcard Image" width={200} height={150} unoptimized={true}/>
                }
                </div>
              </div>

              {/* Back Side */}
              <div className="flashcard-back">
                <p>{flashcard.answer}</p>
              </div>
            </div>
          </div>
        ))}
      </Carousel>

      <Button onClick={() => router.push(`/decks`)} type="primary" style={{ marginTop: "20px" }}>
                  Back to Decks
      </Button>
    </div>
  );
};

export default FlashcardsPage;
