"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { Deck } from "@/types/deck";
import { Modal, Button, Carousel } from "antd";
import { EditOutlined,DeleteOutlined } from "@ant-design/icons";
import "@/styles/FlashcardCarousel.css"; // Optional: for custom styles
import { requestNotificationPermission } from "@/lib/firebase";
import { onMessage } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { notification } from "antd";

const DecksPage: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();
    const [decks, setDecks] = useState<Deck[]>([]);
    const [view, setView] = useState<"private" | "public">("private");

    const [userIdAsNumber, setUserIdAsNumber] = useState<number | null>(null);

    const [fcmToken, setFcmToken] = useState<string | null>(null);

    const [quizInvites, setQuizInvites] = useState<{ fromUserId: string; toUserId: string; quizId: string } | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        const registerServiceWorker = async () => {
          if ("serviceWorker" in navigator) {
            try {
              const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
              console.log("Service Worker registered:", registration);
            } catch (error) {
              console.error("Service Worker registration failed:", error);
            }
          }
        };

        const fetchAndStoreFcmToken = async () => {
          try {
            const existingToken = localStorage.getItem("fcmToken");
            if (existingToken) {
              console.log("FCM token already exists:", existingToken);
              setFcmToken(existingToken);
              return; // Use the existing token
            }

            const newToken = await requestNotificationPermission();
            if (newToken) {
              setFcmToken(newToken);
              localStorage.setItem("fcmToken", newToken);
              await apiService.put(`/users/${userIdAsNumber}`, { fcmToken: newToken });
            }
          } catch (error) {
            console.error("Error setting FCM token:", error);
          }
        };
        
        registerServiceWorker();
        fetchAndStoreFcmToken();
      }, [userIdAsNumber]); // Re-run if user ID changes
    
      useEffect(() => {
        if (!messaging) return;
    
        // 🔴 3️⃣ Listen for foreground FCM messages
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log("New FCM message received:", payload);
      
          if (payload.notification && payload.data) {
            const { title, body } = payload.notification;
            const { type, quizId, fromUserId, toUserId, accepted } = payload.data;
      
            if (type === "invitation") {
              // 📌 Handle quiz invitation
              notification.info({
                message: title,
                description: body,
                placement: "topRight",
              });
              

              // if (Number(payload.data.receiverId) === userIdAsNumber) {
                setQuizInvites({ fromUserId,toUserId, quizId:quizId });
                setModalVisible(true);
              // } else {
              //   console.log("Quiz invitation received, but not for this user.");
              // }
      
            } else if (type === "response") {
              // 📌 Handle quiz response
              const isAccepted = accepted === "true";
      
              notification.info({
                message: isAccepted ? "Quiz Accepted!" : "Invitation Declined",
                description: isAccepted
                  ? "Your quiz invitation has been accepted!"
                  : "Your quiz invitation was declined.",
                placement: "topRight",
              });
      
              if (isAccepted) {
                // 🚀 Redirect sender to the quiz page
                router.push(`/quiz/${quizId}`);
              }
            }
          }
        });
    
        return () => unsubscribe();
      }, []);

      const handleAccept = async () => {
        console.log("Accepted quiz:", quizInvites?.quizId);
        const response = {
          ...quizInvites,
          response:true
        }
        await apiService.put(`/quiz/respond`,response);
        setModalVisible(false);
        setQuizInvites(null);
        router.push(`/quiz/${quizInvites?.quizId}`);
      };
    
      const handleDecline = async () => {
        console.log("Declined quiz:", quizInvites?.quizId);
        const response = {
          ...quizInvites,
          response:false
        }
        await apiService.put(`/quiz/respond`,response);
        setModalVisible(false);
        setQuizInvites(null);
      };
    

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
              <Modal
                title="Quiz Invitation"
                open={modalVisible}
                onCancel={handleDecline} // Clicking outside or on close button will decline
                footer={[
                  <Button key="decline" onClick={handleDecline}>
                    Decline
                  </Button>,
                  <Button key="accept" type="primary" onClick={handleAccept}>
                    Accept
                  </Button>,
                ]}
              >
                <p>User with ID <strong>{quizInvites?.fromUserId}</strong> invited you to a quiz!</p>
              </Modal>

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
          <Button onClick={() => router.push("/users")} type="primary" style={{ marginTop: "20px" }}>
                  Start a Quiz
          </Button>
          <Button onClick={handleLogout} type="primary" style={{ marginTop: "20px" }}>
                  Logout
          </Button>
        </div>
      );
    };
    
export default DecksPage;
