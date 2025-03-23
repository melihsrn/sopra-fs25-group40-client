"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card,Form, Input, Button, Upload, message } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { Flashcard } from "@/types/flashcard";
import { useApi } from "@/hooks/useApi";
import type { UploadChangeParam } from "antd/es/upload";
import type { UploadFile } from "antd/es/upload/interface";
import { getApiDomain } from "@/utils/domain";
import Image from "next/image";

const EditFlashcardPage: React.FC = () => {
  const router = useRouter();
  const { deckId,flashcardId } = useParams();
  const apiService = useApi();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>(['', '', '']);
  const apiUrl = getApiDomain();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleWrongAnswerChange = (index: number, value: string) => {
    const newAnswers = [...wrongAnswers];
    newAnswers[index] = value;
    setWrongAnswers(newAnswers);
  };

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


  useEffect(() => {
    if (isNaN(Number(flashcardId))) {
      message.error("Invalid flashcard ID");
      router.push("/flashcards");
      return;
    }

    const fetchFlashcard = async () => {
      try {
        const flashcard = await apiService.get<Flashcard>(`/flashcards/${flashcardId}`);
        form.setFieldsValue({
          description: flashcard?.description,
          answer: flashcard?.answer,
          date: flashcard?.date, // if needed (date handling)
        });

        // Initialize wrongAnswers state
        setWrongAnswers([
          flashcard?.wrongAnswers?.[0] || '',
          flashcard?.wrongAnswers?.[1] || '',
          flashcard?.wrongAnswers?.[2] || ''
      ]);

        // Set the image URL if available
        if (flashcard?.imageUrl) {
          setImageUrl(flashcard.imageUrl);
          setFileList([{ uid: '-1', name: 'image.jpg', status: 'done', url: flashcard.imageUrl }]);
        }
      } catch{
        message.error("Failed to fetch flashcard data");
        router.push("/flashcards");
      }
    };

    fetchFlashcard();
  }, [flashcardId, apiService, form, router]);

  const handleSubmit = async (formValues: Flashcard) => {
    setLoading(true);
    try {
      if (wrongAnswers.filter(a => a.trim()).length === 0) {
        message.error("Please provide at least one wrong answer.");
        setLoading(false);
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
      } else if (fileList.length === 0) {
        // If no file, ensure the image URL is null
        finalImageUrl = null;
      }

      const flashcardData = {
        ...formValues,
        wrongAnswers: wrongAnswers.filter(a => a.trim()), // inject into submitted object
        imageUrl: finalImageUrl, // Include the final image URL
      };

      await apiService.put(`/flashcards/${flashcardId}`, flashcardData);
      message.success("Flashcard updated successfully!");
      router.push(`/decks/${deckId}/flashcards`); // go back to flashcard list
    } catch (error) {
      message.error("Failed to update flashcard");
      console.error("Update error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (imageUrl) {
      try {
        await apiService.delete(`/flashcards/delete-image?imageUrl=${encodeURIComponent(imageUrl)}`);
        setImageUrl(null);
        setFileList([]);
        message.success("Image removed successfully");
      } catch {
        message.error("Failed to remove image.");
      }
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
    <Card title={`Update Flashcard`} style={{ width: 400 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) =>     
          handleSubmit({
          ...values,
          wrongAnswers: wrongAnswers.filter(a => a.trim()) // inject into submitted object
        })
      }
      >
        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: "Please enter a description" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Answer"
          name="answer"
          rules={[{ required: true, message: "Please enter an answer" }]}
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

        <Form.Item label="Date" name="date">
          <Input type="date" />
        </Form.Item>

        <Form.Item label="Image">
              {imageUrl ? (
                <div style={{ position: "relative", display: "inline-block" }}>
                  <Image
                    src={`${apiUrl}/flashcards/image?imageUrl=${encodeURIComponent(imageUrl)}`}
                    alt="Flashcard"
                    unoptimized={true}
                    style={{ width: "100%", marginTop: "10px", borderRadius: "5px" }}
                    width={200} height={150}
                  />
                  <div>
                  <Button
                    type="link"
                    icon={<DeleteOutlined />}
                    // className="delete-button"
                    style={{color: "#ff4000" }}
                    onClick={handleDeleteImage}
                  />
                  </div>
                </div>
              ) : (
                <Upload
                  fileList={fileList}
                  beforeUpload={() => false}
                  onChange={handleImageChange}
                  listType="picture-card"
                >
                  {fileList.length >= 1 ? null : <Button icon={<UploadOutlined />}>Upload Image</Button>}
                </Upload>
              )}
          </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Save Changes
          </Button>
          <Button style={{ marginLeft: "10px" }} onClick={() => router.push(`/decks/${deckId}/flashcards`)}>
          Cancel
          </Button>
        </Form.Item>

      </Form>
    </Card>
    </div>
  );
};

export default EditFlashcardPage;
