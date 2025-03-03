"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Card, Button, Spin, Form, Input, message } from "antd";

const UserProfile: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { id } = useParams();
  const { value: user_id } = useLocalStorage<string>("user_id", ""); // Retrieve user id
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  interface FormFieldProps {
    label: string;
    value: string;
  }

  useEffect(() => {  
    const checkLogged = async () => {
      try {  
        if (!localStorage.getItem("token")) {
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
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
    const fetchUser = async () => {
      try {
        if (!id) return;
        const fetchedUser = await apiService.get<User>(`/users/${id}`);
        setUser(fetchedUser);
      } catch (error) {
        console.error("Error fetching user details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, apiService]);

  const handleEdit = () => {
    setIsEditing(true);
    form.setFieldsValue({
      username: user?.username,
      birthday: user?.birthday,
    });
  };

  const handleSave = async (updates: FormFieldProps) => {
    try {
  
      await apiService.put(`/users/${id}`, updates);
      const updatedUser = await apiService.get<User>(`/users/${id}`);
  
      setUser(updatedUser);
      setIsEditing(false);
      message.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating user profile:", error);
      message.error("Failed to update profile.");
    }
  };
  

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Spin size="large" />
      </div>
    );
  }
  
  if (!user_id){
    router.push("/login");
  }

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <p>User not found</p>
        <Button onClick={() => router.push("/users")} type="primary">
          Back to Users
        </Button>
      </div>
    );
  }

  // Ensure users can only edit their own profile
  const isOwner = Number(id) === Number(user_id);

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
      <Card title={`User Profile: ${user.username}`} style={{ width: 400 }}>
        {isEditing ? (
          <Form form={form} onFinish={handleSave} layout="vertical">
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: "Username is required!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="birthday" label="Birthday">
                <Input type="date" /> 
            </Form.Item>
            <Button type="primary" htmlType="submit">Save</Button>
            <Button style={{ marginLeft: "10px" }} onClick={() => setIsEditing(false)}>Cancel</Button>
          </Form>
        ) : (
          <>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Status:</strong> {user.status}</p>
            <p><strong>Creation Date:</strong> {new Date(user.creationDate).toLocaleDateString()}</p>
            {user.birthday && <p><strong>Birthday:</strong> {new Date(user.birthday).toLocaleDateString()}</p>}
            <Button onClick={() => router.push("/users")} type="primary">Back to Users</Button>
            {isOwner && (
              <Button onClick={handleEdit} style={{ marginLeft: "10px" }}>
                Edit Profile
              </Button>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default UserProfile;
