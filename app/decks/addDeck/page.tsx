"use client";

import React, { useState } from "react";
import { Checkbox, Card, Form, Input, Button, Select, InputNumber, message } from "antd";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";

const { Option } = Select;

type DeckFormValues = {
  title: string;
  deckCategory: string;
  isPublic?: boolean;
  isAiGenerated?: boolean;
  aiPrompt?: string;
  numberofAICards?: number;
};

const AddDeckPage: React.FC = () => {
  const [form] = Form.useForm();
  const [isAiEnabled, setIsAiEnabled] = useState(false);
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
    console.log("Submitted form values:", values);
    try {
      if (values.isPublic == null) {
        values.isPublic = false;
      }
      const deckDTO = {
        title: values.title,
        deckCategory: values.deckCategory,
        isPublic: values.isPublic,
        isAiGenerated: values.isAiGenerated || false,
        aiPrompt: values.aiPrompt || "",
        numberofAICards: values.numberofAICards || null,
      };

      console.log("Sending deckDTO:", deckDTO);
      await apiService.post(`/decks/addDeck?userId=${userIdAsNumber}`, deckDTO);
      message.success("Deck added successfully!");
      router.push("/decks");
    } catch (error) {
      console.error("Error adding deck:", error);
      message.error("Failed to add deck.");
    }
  };

  return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
        <Card title="Add New Deck" style={{ width: 400 }}>
          <Form
              form={form}
              onFinish={handleAddDeck}
              onValuesChange={(changed, all) => {
                if ("isAiGenerated" in changed) {
                  setIsAiEnabled(changed.isAiGenerated);
                  console.log("isAiGenerated changed:", changed.isAiGenerated);
                }
                if ("numberofAICards" in changed) {
                  console.log("numberofAICards changed:", changed.numberofAICards);
                }
                console.log("All form values:", all);
              }}
              layout="vertical"
              initialValues={{ numberofAICards: 5 }}
          >
            <Form.Item
                label="Title"
                name="title"
                rules={[{ required: true, message: "Title is required" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
                label="Deck Category"
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

            <Form.Item name="isAiGenerated" valuePropName="checked">
              <Checkbox>Generate with AI</Checkbox>
            </Form.Item>

            {/* AI Prompt Field */}
            <Form.Item
                label="AI Prompt"
                name="aiPrompt"
                dependencies={['isAiGenerated']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!getFieldValue("isAiGenerated") || (value && value.trim() !== "")) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("AI Prompt is required when generating with AI"));
                    },
                  }),
                ]}
            >
              <Input.TextArea placeholder="Enter your prompt for AI deck generation" disabled={!isAiEnabled} />
            </Form.Item>

            {/* Number of Cards Field */}
            <Form.Item
                label="Number of Cards to Generate"
                name="numberofAICards"
                dependencies={['isAiGenerated']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!getFieldValue("isAiGenerated") || (value && value > 0)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Please specify number of cards to generate"));
                    },
                  }),
                ]}
            >
              <InputNumber
                  min={1}
                  style={{ width: "100%" }}
                  disabled={!isAiEnabled}
                  onChange={(value) => console.log("InputNumber onChange:", value)}
              />
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
