"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Checkbox,Card,Form, Input, Button, Select, message } from "antd";
const { Option } = Select;
import { Flashcard } from "@/types/flashcard";
import { useApi } from "@/hooks/useApi";
import { Deck } from "@/types/deck";

const EditDeckPage: React.FC = () => {
  const router = useRouter();
  const { deckId } = useParams();
  const apiService = useApi();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (isNaN(Number(deckId))) {
      message.error("Invalid deck ID");
      router.push("/decks");
      return;
    }

    const fetchDeck = async () => {
      try {
        const deck = await apiService.get<Deck>(`/decks/${deckId}`);
        form.setFieldsValue({
          title: deck?.title,
          deckCategory: deck?.deckCategory,
          isPublic: deck?.isPublic,
        });

      } catch{
        message.error("Failed to fetch deck data");
        router.push("/decks");
      }
    };

    fetchDeck();
  }, [deckId, apiService, form, router]);

  const handleSubmit = async (formValues: Flashcard) => {
    setLoading(true);
    try {
      const deckData = {
        ...formValues,
      };

      await apiService.put(`/decks/${deckId}`, deckData);
      message.success("Deck updated successfully!");
      router.push("/decks"); 
    } catch (error) {
      message.error("Failed to update deck");
      console.error("Update error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
    <Card title={`Update Deck`} style={{ width: 400 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) =>     
          handleSubmit({...values})
        }
      >
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please enter a title" }]}
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

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Save Changes
          </Button>
          <Button style={{ marginLeft: "10px" }} onClick={() => router.push("/decks")}>
          Cancel
          </Button>
        </Form.Item>

      </Form>
    </Card>
    </div>
  );
};

export default EditDeckPage;
