// decks/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { Deck } from "@/types/deck";
import { Modal, Button, Carousel,Table,TableProps } from "antd";
import { EditOutlined,DeleteOutlined } from "@ant-design/icons";
import "@/styles/FlashcardCarousel.css"; // Optional: for custom styles
import { User } from "@/types/user";
import { Invitation } from "@/types/invitation";

const DecksPage: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();
    const [decks, setDecks] = useState<Deck[]>([]);
    const [view, setView] = useState<"private" | "public">("private");

    const [userIdAsNumber, setUserIdAsNumber] = useState<number | null>(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [quizInvites, setQuizInvites] = useState<Invitation[]>([]);
    const [selectedInvite, setSelectedInvite] = useState<Invitation | null>(null);
    const [selectedInviteFromUser, setSelectedInviteFromUser] = useState<User | null>(null);
    const [invitationsSent, setInvitationsSent] = useState<Invitation[]>([]);
    

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
    /* ✨ NEW — simple helper */
    const handleShowStats = () => {
        if (userIdAsNumber != null) {
            router.push(`/statistics/${userIdAsNumber}`);
        }
    };
      useEffect(() => {
        const checkAcceptedInvites = async () => {
          if (userIdAsNumber) {
            try {
              // This endpoint returns an accepted invitation *to* this user (if any)
              const acceptedInvite = await apiService.get<Invitation | null>(
                `/quiz/invitation/accepted?fromUserId=${userIdAsNumber}`
              );
        
              if (acceptedInvite && acceptedInvite.quizId) {
                const quizId = acceptedInvite.quizId;
                // await apiService.delete(`/quiz/invitation/delete/${acceptedInvite.id}`); // todo will be deleted in quiz/finish/[quizId]
                  localStorage.setItem("current_invitation_id", String(acceptedInvite.id));
                // Once detected, redirect to the quiz
                router.push(`/quiz/${quizId}`);
              }
            } catch (error) {
              console.error("Error checking accepted invites:", error);
            }
          }
        };        
    
        checkAcceptedInvites();
        const interval = setInterval(checkAcceptedInvites, 1000);
        return () => clearInterval(interval);
      }, [userIdAsNumber]);
    
      useEffect(() => {
        const getInvitations = async () => {
          if (userIdAsNumber) {
            const invitationsSent = await apiService.get<Invitation[]>(`/quiz/invitation/senders?fromUserId=${userIdAsNumber}`);
            const invitationsReceived = await apiService.get<Invitation[]>(`/quiz/invitation/receivers?toUserId=${userIdAsNumber}`);
            setQuizInvites(invitationsReceived);
            setInvitationsSent(invitationsSent);
          }
        };
    
        getInvitations();
        const interval = setInterval(getInvitations, 1000);
        return () => clearInterval(interval);
      }, [userIdAsNumber]);

      const handleAccept = async () => {
        try {
          // Step 1: Confirm invitation acceptance and get response
          await apiService.get(`/quiz/response/confirmation?invitationId=${Number(selectedInvite?.id)}`);
          
          // Step 2: Wait for 1 second before moving forward
          await new Promise(resolve => setTimeout(resolve, 1000));
      
          // Step 3: Re-check status of the other user (fromUser)
          const user = await apiService.get<User>(`/users/${userIdAsNumber}`);
          const fromUserStatus = user.status;
      
          if (fromUserStatus !== 'PLAYING') {
            alert("The other user has started another quiz.");
            setModalVisible(false);
            setSelectedInvite(null);
            return;
          }

          if (selectedInvite) {
            localStorage.setItem("current_invitation_id", String(selectedInvite.id));
          }
            // Step 4: Proceed to quiz
          setModalVisible(false);
          setSelectedInvite(null);
          router.push(`/quiz/${selectedInvite?.quizId}`);
      
        } catch (error) {
          console.error("Error during quiz acceptance:", error);
          alert("An error occurred while joining the quiz.");
          setModalVisible(false);
          setSelectedInvite(null);
        }
      };
      
    
      const handleDecline = async () => {
        await apiService.delete(`/quiz/response/rejection?invitationId=${Number(selectedInvite?.id)}`);
        setModalVisible(false);
        setSelectedInvite(null);
      };

      const handleSelectInvitation = async (invitation: Invitation) => {
        const fromUser = await apiService.get<User>(`/users/${invitation.fromUserId}`)
        setSelectedInvite(invitation);
        setSelectedInviteFromUser(fromUser);
        setModalVisible(true);
      };
    
      const columns: TableProps<Invitation>["columns"] = [
        {
        title: "Invitation Id",
        dataIndex: "id",
        key: "invitationId",
      },
      {
        title: "Sender Username",
        dataIndex: "fromUserId",
        key: "fromUserId",
      },
        ];

      return (

        <div className="flashcard-carousel-container">
            <Modal
              title="Quiz Invitation"
              open={modalVisible}
              onCancel={handleDecline}
              footer={[
                <Button key="decline" onClick={handleDecline}>Decline</Button>,
                <Button key="accept" type="primary" onClick={handleAccept}>Accept</Button>
              ]}
            >
              <strong>{selectedInviteFromUser?.username}</strong> sent you a quiz invitation.
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

            <Button
                onClick={handleShowStats}       /* 👈 use new handler */
                type="default"
                disabled={userIdAsNumber == null}
                style={{ marginTop: "20px", marginLeft: "12px" }}
            >
                Show Statistics
            </Button>

            <Button onClick={handleLogout} type="primary" style={{ marginTop: "20px" }}>
                  Logout
          </Button>

            {/* Invitations Table */}
            {/* <div style={{ width: "300px" }}>
              <Table dataSource={quizInvites} columns={columns} size="small" pagination={false} />
            </div> */}
            <Table<Invitation>
              columns={columns}
              dataSource={quizInvites}
              rowKey="id"
              onRow={(row) => ({
                onClick: () => handleSelectInvitation(row),
                style: { cursor: "pointer" },
              })}
            />
        </div>
      );
    };
    
export default DecksPage;
