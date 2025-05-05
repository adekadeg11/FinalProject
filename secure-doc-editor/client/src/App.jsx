import React, { useState, useEffect } from 'react';
import DocumentEditor from './components/DocumentEditor';
import { fetchDocument } from './api';

const App = () => {
  const [documentId, setDocumentId] = useState('12345');

  useEffect(() => {
    // Fetch the document on load, if needed
    fetchDocument(documentId);
  }, [documentId]);

  return (
    <div>
      <h1>Secure Document Editor</h1>
      <DocumentEditor documentId={documentId} />
    </div>
  );
};

export default App;
