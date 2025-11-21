import React from 'react';
import { formatDate } from '@infocus/shared';

const App: React.FC = () => {
  return (
    <div>
      <h1>InFocus Web App</h1>
      <p>Placeholder for the InFocus web application</p>
      <p>Current date: {formatDate(new Date())}</p>
    </div>
  );
};

export default App;
