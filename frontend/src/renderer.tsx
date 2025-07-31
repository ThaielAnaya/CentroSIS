import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => <h1>Hello from TSX in Electron</h1>;

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
