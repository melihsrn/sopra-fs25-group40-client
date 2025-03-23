"use client";

import React, {useEffect, useState} from "react";
import { Upload,Checkbox,Card,Form, Input, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { Flashcard } from "@/types/flashcard";
import { Deck } from "@/types/deck";
import { useRouter,useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import type { UploadChangeParam } from "antd/es/upload";
import type { UploadFile } from "antd/es/upload/interface";
import Image from "next/image";

type FlashcardFormValues = {
  description: string;
  answer: string;
  date?: string;
  isPublic?: boolean;
  flashcardCategory: string;
};

const AddFlashcardPage: React.FC = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const apiService = useApi();

  const { deckId } = useParams();

  const { value: user_id } = useLocalStorage<string>("user_id", "");
  const userIdAsNumber = Number(user_id);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>(['', '', '']);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  if (isNaN(userIdAsNumber)) {
    message.error("Invalid user id. Please log in again.");
    router.push("/login");
    return null;
  }

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
        flashcardCategory: deck?.deckCategory,
        isPublic: deck?.isPublic,
      });

    } catch{
      message.error("Failed to fetch deck data");
      router.push("/decks");
    }
  };

  fetchDeck();
}, [deckId, apiService, form, router]);

  const handleImageChange = async ({ file, fileList }: UploadChangeParam<UploadFile>) => {
    setFileList(fileList);

    if (file.status === "removed") {
        setImageUrl(null);  // Clear image URL when removing
        return;
    }

    if (file.originFileObj) {
        try {
            const uploadedImageUrl = await apiService.uploadImage("/flashcards/upload-image", file.originFileObj);
            setImageUrl(uploadedImageUrl);
            message.success("Image uploaded successfully!");
        } catch {
            message.error("Image upload failed.");
            setFileList([]);  // Clear the failed file
        }
    }
};




  const handleWrongAnswerChange = (index: number, value: string) => {
    const newAnswers = [...wrongAnswers];
    newAnswers[index] = value;
    setWrongAnswers(newAnswers);
  };

  const handleAddFlashcard = async (values: FlashcardFormValues) => {
    try {
      if (wrongAnswers.filter(a => a.trim()).length === 0) {
        alert('Please provide at least one wrong answer.');
        return;
      }

      let finalImageUrl = imageUrl;

      if (fileList.length > 0 && fileList[0].originFileObj) {
          try {
              finalImageUrl = await apiService.uploadImage("/flashcards/upload-image", fileList[0].originFileObj);
          } catch {
              message.error("Image upload failed. Please try again.");
              return;
          }
      }

      const flashcardDTO = {
        description: values.description,
        answer: values.answer,
        wrongAnswers: wrongAnswers.filter(a => a.trim()), // Remove empty ones
        date: values.date, // or allow user to select date
        imageUrl: finalImageUrl || null,
        isPublic: values.isPublic,
        flashcardCategory: values.flashcardCategory,
      };

      await apiService.post<Flashcard>(
        `/decks/${deckId}/flashcards/addFlashcard`,
        flashcardDTO
      );

      message.success("Flashcard added successfully!");
      router.push(`/decks/${deckId}/flashcards`); // Go back to flashcards list
    } catch (error) {
      console.error("Error adding flashcard:", error);
      message.error("Failed to add flashcard.");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
    <Card title={`Add New Flashcard`} style={{ width: 400 }}>
      <Form form={form} onFinish={handleAddFlashcard} layout="vertical">
      <Form.Item
          label="Date"
          name="date"
          rules={[{ required: false }]}
        >
          <Input type="date" /> 
        </Form.Item>
        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: "Description is required" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Flashcard Category"
          name="flashcardCategory"
        >
          <Input disabled/>
        </Form.Item>

        <Form.Item
          label="Answer"
          name="answer"
          rules={[{ required: true, message: "Answer is required" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Wrong Answers (at least 1 required)">
          {['First', 'Second', 'Third'].map((label, index) => (
            <div key={index} style={{ marginBottom: 8 }}>
              <Input
                placeholder={`${label} Wrong Answer`}
                value={wrongAnswers[index]}
                onChange={(e) => handleWrongAnswerChange(index, e.target.value)}
              />
            </div>
          ))}
        </Form.Item>

        <Form.Item label="Image">
              <Upload
                  fileList={fileList}
                  beforeUpload={() => false}  // Don't auto-upload, we will upload manually
                  onChange={handleImageChange}
                  listType="picture-card"
                  onRemove={() => {
                      setFileList([]);
                      setImageUrl(null);  // Clear imageUrl when removed
                  }}
              >
                  {fileList.length >= 1 ? null : <Button icon={<UploadOutlined />}>Upload Image</Button>}
              </Upload>
              {imageUrl && (
                  <Image
                      src={imageUrl}
                      alt="Flashcard"
                      unoptimized={true}
                      style={{ width: "100%", marginTop: "10px", borderRadius: "5px" }}
                  />
              )}
          </Form.Item>

        <Form.Item name="isPublic" valuePropName="checked">
          <Checkbox disabled >Public</Checkbox>
        </Form.Item>

        <Button type="primary" htmlType="submit">
          Save Flashcard
        </Button>

        <Button style={{ marginLeft: "10px" }} onClick={() => router.push(`/decks/${deckId}/flashcards`)}>
          Cancel
          </Button>
      </Form>
    </Card>
    </div>
  );
};

export default AddFlashcardPage;
