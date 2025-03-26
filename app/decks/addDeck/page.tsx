"use client";

import React from "react";
import { Checkbox,Card,Form, Input, Button,Select, message } from "antd";

const { Option } = Select;

import { Flashcard } from "@/types/flashcard";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";


type DeckFormValues = {
  title: string;
  deckCategory: string;
  isPublic?: boolean;
};

const AddDeckPage: React.FC = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const apiService = useApi();

  const { value: user_id } = useLocalStorage<string>("user_id", "");
  const userIdAsNumber = Number(user_id);

  if (isNaN(userIdAsNumber)) {
    message.error("Invalid user id. Please log in again.");
    router.push("/login");
    return null;
  }

  const handleAddDeck = async (values: DeckFormValues) => {
    try {

      if (!values.isPublic || values.isPublic === null){
        values.isPublic = false;
      }
  
      const deckDTO = {
        title: values.title,
        deckCategory: values.deckCategory,
        isPublic: values.isPublic,
      };

      await apiService.post<Flashcard>(
        `/decks/addDeck?userId=${userIdAsNumber}`,
        deckDTO
      );

      message.success("Deck added successfully!");
      router.push("/decks"); // Go back to flashcards list
    } catch (error) {
      console.error("Error adding deck:", error);
      message.error("Failed to add deck.");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
    <Card title={`Add New Deck`} style={{ width: 400 }}>
      <Form form={form} onFinish={handleAddDeck} layout="vertical">
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Title is required" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="DeckCategory"
          name="deckCategory"
          rules={[{ required: true, message: "Deck Category is required" }]}
        >
          <Select placeholder="Select a category">
            <Option value="MOMENTS">Moments</Option>
            <Option value="SPORTS">Sports</Option>
            <Option value="ANIMALS">Animals</Option>
            <Option value="PLACES">Places</Option>
            <Option value="FOODS">Foods</Option>
            <Option value="SCIENCE">Science</Option>
            <Option value="MATH">Math</Option>
            <Option value="HISTORY">History</Option>
            <Option value="LANGUAGE">Language</Option>
            <Option value="TECHNOLOGY">Technology</Option>
            <Option value="OTHERS">Others</Option>
            <Option value="MIXED">Mixed</Option>
          </Select>
        </Form.Item>

        <Form.Item name="isPublic" valuePropName="checked">
          <Checkbox>Public</Checkbox>
        </Form.Item>

        <Button type="primary" htmlType="submit">
          Save Deck
        </Button>

        <Button style={{ marginLeft: "10px" }} onClick={() => router.push("/decks")}>
          Cancel
          </Button>
      </Form>
    </Card>
    </div>
  );
};

export default AddDeckPage;
