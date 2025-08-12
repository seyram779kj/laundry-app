import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import axios from 'axios';

interface Message {
  _id: string;
  chatRoomId: string;
  senderType: 'customer' | 'service_provider' | 'admin';
  senderId: string;
  content: string;
  timestamp: string;
  readBy: string[];
}

const Chat: React.FC = () => {
  const { chatRoomId } = useParams<{ chatRoomId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserId(user._id || user.id);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`http://localhost:5000/api/chats/${chatRoomId}/messages`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setMessages(response.data);
        console.log('Messages:', response.data);

        // Mark messages as read
        await axios.patch(
          `http://localhost:5000/api/chats/${chatRoomId}/messages/read`,
          { userId },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Fetch messages error:', errorMessage, error);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    if (userId && chatRoomId) {
      fetchMessages();
    }
  }, [chatRoomId, userId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    try {
      const response = await axios.post(
        `http://localhost:5000/api/chats/${chatRoomId}/message`,
        {
          senderType: 'service_provider',
          senderId: userId,
          content: newMessage,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setMessages([...messages, response.data]);
      setNewMessage('');
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Send message error:', errorMessage, error);
      setError('Failed to send message');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Chat for Order
      </Typography>
      <List sx={{ maxHeight: 400, overflowY: 'auto', mb: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
        {messages.map((message) => (
          <ListItem
            key={message._id}
            sx={{
              justifyContent: message.senderId === userId ? 'flex-end' : 'flex-start',
              bgcolor: message.senderId === userId ? 'primary.light' : 'grey.100',
              m: 1,
              borderRadius: 2,
              maxWidth: '70%',
            }}
          >
            <ListItemText
              primary={message.content}
              secondary={format(new Date(message.timestamp), 'MMM dd, yyyy hh:mm a')}
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          label="Type a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <Button variant="contained" onClick={handleSendMessage}>
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default Chat;