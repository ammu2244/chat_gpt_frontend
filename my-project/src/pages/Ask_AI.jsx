import React, { useState } from 'react';

const Ask_AI = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');

  const testSubmit = (e) => {
    e.preventDefault();
    setResponse("The frontend is working! Input was: " + input);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>AI Interface Test</h1>
      <form onSubmit={testSubmit}>
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Type here..."
        />
        <button type="submit">Test Click</button>
      </form>
      <p>{response}</p>
    </div>
  );
};

export default Ask_AI;