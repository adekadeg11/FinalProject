import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: { token: localStorage.getItem('token') },
});

const DocumentEditor = ({ documentId }) => {
  const [content, setContent] = useState('');
  const [cursorPosition, setCursorPosition] = useState(null);
  const [delta, setDelta] = useState('');

  useEffect(() => {
    socket.emit('joinDocument', { documentId });

    socket.on('documentData', (document) => {
      setContent(document.content);
    });

    socket.on('textChange', ({ delta }) => {
      setDelta(delta);
    });

    socket.on('cursorMove', ({ position }) => {
      setCursorPosition(position);
    });

    return () => {
      socket.emit('leaveDocument', { documentId });
    };
  }, [documentId]);

  const handleTextChange = (event) => {
    const delta = event.target.value; 
    setContent(delta);

    socket.emit('textChange', {
      documentId,
      delta,
      version: new Date().toISOString(),
    });
  };

  const handleCursorMove = (event) => {
    const position = event.target.selectionStart;
    setCursorPosition(position);
    socket.emit('cursorMove', { documentId, position });
  };

  return (
    <div>
      <textarea
        value={content}
        onChange={handleTextChange}
        onSelect={handleCursorMove}
        rows={20}
        cols={100}
      ></textarea>
    </div>
  );
};

export default DocumentEditor;
