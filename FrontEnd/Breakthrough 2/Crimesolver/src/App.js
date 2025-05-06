import React from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Contact from "./pages/contact";
import Upload from "./pages/upload";
import ConnectionTest from './pages/ConnectionTest'; // External component
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      {/* Show backend connection status */}
      <ConnectionTest />

      {/* App routes */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/Contact" element={<Contact />} />
          <Route path="/Upload" element={<Upload />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
