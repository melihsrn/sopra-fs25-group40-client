"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { Deck } from "@/types/deck";
import { Button, Carousel } from "antd";
import { EditOutlined,DeleteOutlined } from "@ant-design/icons";
import "@/styles/FlashcardCarousel.css"; // Optional: for custom styles


const DecksPage: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();
    const [decks, setDecks] = useState<Deck[]>([]);
    const [view, setView] = useState<"private" | "public">("private");

    const [userIdAsNumber, setUserIdAsNumber] = useState<number | null>(null);

    useEffect(() => {
        const storedUserId = localStorage.getItem("user_id");
        if (storedUserId) {
          const parsedUserId = Number(storedUserId);
          if (!isNaN(parsedUserId)) {
            setUserIdAsNumber(parsedUserId);
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
        const fetchDecks = async () => {
            try {
                if (view === "private") {
                    const fetchedDecks = await apiService.get<Deck[]>(`/decks?userId=${userIdAsNumber}`);
                    setDecks(fetchedDecks);
                } else {
                    const fetchedDecks = await apiService.get<Deck[]>(`/decks/public`);
                    const publicDecks = fetchedDecks.filter(fc => fc.isPublic);  // extra safety check

                    setDecks(publicDecks);
                }
            } catch (error) {
                alert("Error fetching flashcards");
                console.error(error);
            }
        };
    
        if (userIdAsNumber !== null) {
            fetchDecks();
        }
    }, [apiService, userIdAsNumber, view]); 


    const handleEdit = (deckId: string | null) => {
        router.push(`/decks/${deckId}`);
      };
    
    const handleDelete = async (deckId: string) => {
    await apiService.delete(`/decks/${deckId}`);
    setDecks((decks) =>
        decks.filter((decks) => decks.id !== deckId)
    );
    };

    const handleLogout = async () => {
        try {
          // Make a DELETE request to the logout endpoint
          await apiService.delete(`/users/logout/${userIdAsNumber}`);
      
          // Clear the token from local storage or any other relevant data
          localStorage.removeItem("token");
          localStorage.removeItem("user_id");
      
          // Redirect the user to the login page
          router.push("/login");
        } catch (error) {
          console.error("Error during logout:", error);
          alert("An error occurred while logging out.");
        }
      };

      return (
        <div className="flashcard-carousel-container">
            <Button
            type="primary"
            style={{ marginBottom: "20px" }}
            onClick={() => router.push("/decks/addDeck")}
          >
            Add New Deck
          </Button>
    
    
          {/* Custom Radio Buttons (as Text Links) */}
          <div className="flashcard-header">
            <div className="view-selector">
              <span
                className={`view-option ${view === "private" ? "active" : ""}`}
                onClick={() => setView("private")}
              >
                My Decks
              </span>
              |
              <span
                className={`view-option ${view === "public" ? "active" : ""}`}
                onClick={() => setView("public")}
              >
                Public Decks
              </span>
            </div>
          </div>
    
          <Carousel arrows infinite={false}>
            {decks.map((deck, index) => (
              <div key={deck.id} className="flashcard-wrapper">
                  {/* Front Side */}
                  <div className="flashcard-front"
                  onClick={() => router.push(`/decks/${deck.id}/flashcards`)} // Navigate to flashcards page
                  style={{ cursor: "pointer" }} // Add pointer cursor to indicate clickability
                  >
                    { (view === "private" || Number(deck.user.id) === userIdAsNumber) &&(
                    <div className="flashcard-header">
                      <Button
                        type="link"
                        icon={<EditOutlined />}
                        className="edit-button"
                        onClick={(e) => {
                          e.stopPropagation(); // prevent flipping on edit click
                          handleEdit(deck.id);
                        }}
                      />
                    </div>
                    )}
    
                    { (view === "private" || Number(deck.user.id) === userIdAsNumber) && (
                      <div className="flashcard-footer">
                      <Button
                        type="link"
                        icon={<DeleteOutlined />}
                        className="delete-button"
                        style={{color: "#ff4000" }}
                        onClick={(e) => {
                          e.stopPropagation(); // prevent flipping on edit click
                          handleDelete(deck.id);
                        }}
                      />
                    </div>)}
                    
                    <div className="flashcard-content">
                      <p>{deck.title}</p>
                      <p>{deck.deckCategory}</p>
                      <p>{deck.isPublic}</p>
                    </div>
                  </div>

              </div>
            ))}
          </Carousel>
          <Button onClick={handleLogout} type="primary" style={{ marginTop: "20px" }}>
                  Logout
          </Button>
        </div>
      );
    };
    
export default DecksPage;
