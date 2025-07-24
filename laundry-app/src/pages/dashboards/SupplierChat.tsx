import React from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Chat from '../../components/Chat';

const apiUrl = 'http://localhost:5000/api';

const SupplierChat: React.FC = () => {
  const { chatRoomId } = useParams<{ chatRoomId: string }>();
  const userId = useSelector((state: any) => state.auth.user?._id || state.auth.user?.id);
  const userRole = 'supplier';

  if (!chatRoomId || !userId) return <div>Loading...</div>;

  return (
    <div style={{ marginTop: 32 }}>
      <h2>Customer Chat</h2>
      <Chat chatRoomId={chatRoomId} userId={userId} userRole={userRole} apiUrl={apiUrl} />
    </div>
  );
};

export default SupplierChat; 