import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      <h1>Welcome to the Secure Document Editor</h1>
      <p>
        <Link to="/login">Login</Link> to access your documents.
      </p>
    </div>
  );
};

export default Home;
