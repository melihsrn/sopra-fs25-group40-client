"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Card, Table,Checkbox,Modal, Select } from "antd";
const { Option } = Select;
import type { TableProps } from "antd"; // antd component library allows imports of types
import { Quiz } from "@/types/quiz";
import { Deck } from "@/types/deck";
// Optionally, you can import a CSS module or file for additional styling:
// import "@/styles/views/Dashboard.scss";

// Columns for the antd table of User objects

const UserLobbyPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [users, setUsers] = useState<User[] | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [publicDecks, setPublicDecks] = useState<Deck[]>([]);
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>([]);
  const [selectedTimeLimit, setSelectedTimeLimit] = useState<number>(2);

  const {
    value: user_id, 
  } = useLocalStorage<string>("user_id", "");

  const columns: TableProps<User>["columns"] = [
    {
        title: "Select",
        dataIndex: "select",
        key: "select",
        render: (text: any, record: User, index: number) => (
          <Checkbox
            checked={record.id === selectedUser?.id}
            disabled={(record.status === "OFFLINE" || record.status === "PLAYING")}
            onChange={() => handleSelectUser(record)}
          />
        ),
      },
    {
    title: "Username",
    dataIndex: "username",
    key: "username",
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
  },
    ];

  // check if user is logged-in!
  useEffect(() => {  
    const checkLogged = async () => {
      const token = localStorage.getItem("token");
      // If token doesn't exist or is null, redirect to login
      if (!token || token === "null") {
        router.push("/login");
      }
    };
    
    // Run check immediately
    checkLogged();
  
    // Set interval to keep checking
    const checkTokenInterval = setInterval(() => {
      checkLogged();
    }, 5000); // Check every 5 seconds
  
    return () => clearInterval(checkTokenInterval); // Cleanup on unmount
  }, [router]);
  

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // apiService.get<User[]> returns the parsed JSON object directly,
        // thus we can simply assign it to our users variable.
        const users: User[] = await apiService.get<User[]>("/users");
        setUsers(users);
        console.log("Fetched users:", users);
      } catch (error) {
        if (error instanceof Error) {
          alert(`Something went wrong while fetching users:\n${error.message}`);
        } else {
          console.error("An unknown error occurred while fetching users.");
        }
      }
    };

    fetchUsers();
  }, [apiService]);
  
    useEffect(() => {
      const fetchPublicDecks = async () => {
        try {
          const decks = await apiService.get<Deck[]>("/decks/public");
          setPublicDecks(decks);
        } catch (err) {
          console.error("Error fetching public decks", err);
        }
      };
    
      fetchPublicDecks();
    }, [apiService]);
  

  const handleSelectUser = (user: User) => {
        setSelectedUser(
            selectedUser && selectedUser.id === user.id ? null : user
        );
    };
  
    const handleSendInvitation = async () => {
      if (!selectedUser?.id) return;
    
      const invitation = {
        fromUserId: user_id,
        toUserId: selectedUser.id,
        timeLimit: selectedTimeLimit * 60, // convert mins to seconds
        deckIds: selectedDeckIds,
      };
    
      try {
        await apiService.post(`/quiz/invitation`, invitation);
        console.log("Quiz invitation sent!");
        setIsModalVisible(false);
        router.push("/decks"); // Optional
      } catch (error) {
        console.error("Failed to send quiz invitation", error);
      }
    };

  return (
    <div className="card-container">
      <Modal
        title={`Invite ${selectedUser?.username}`}
        open={isModalVisible}
        onOk={handleSendInvitation}
        onCancel={() => setIsModalVisible(false)}
        okText="Send"
      >
        <p>Select Decks:</p>
        <Select
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="Select decks"
            value={selectedDeckIds}
            onChange={setSelectedDeckIds}
            options={publicDecks.map((deck) => ({
              value: deck.id.toString(),
              label: deck.title
            }))}
            optionFilterProp="label"   /* enables search filtering by title */
            showSearch
        />

        <p style={{ marginTop: "1rem" }}>Select Time Limit:</p>
        <Select
          style={{ width: "100%" }}
          onChange={(value) => setSelectedTimeLimit(value)}
          value={selectedTimeLimit}
        >
          {[2, 3, 4, 5].map((min) => (
            <Option key={min} value={min}>
              {min} minutes
            </Option>
          ))}
        </Select>
      </Modal>

      <Card
        title="Get all users from secure endpoint:"
        loading={!users}
        className="dashboard-container"
      >
        {users && (
          <>
            {/* antd Table: pass the columns and data, plus a rowKey for stable row identity */}
            <Table<User>
              columns={columns}
              dataSource={users}
              rowKey="id"
              onRow={(row) => ({
                onClick: () => handleSelectUser(row),
                style: { cursor: "pointer" },
              })}
            />
          </>
        )}

        <Button
            type="primary"
            disabled={!selectedUser}
            onClick={() => setIsModalVisible(true)}
            style={{ marginTop: "20px" }}
          >
            Send Invitation
        </Button>

      </Card>
    </div>
  );
};

export default UserLobbyPage;

