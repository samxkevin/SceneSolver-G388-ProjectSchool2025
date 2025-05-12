import React from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Contact from "./pages/contact";
import Upload from "./pages/upload";
import { BrowserRouter, Routes, Route } from 'react-router-dom';


function App() {
  return (
    <BrowserRouter>
      <Routes>
      <Route path="/" element={<Index />} />{/* Updated path */}
        <Route path="/Login" element={<Login />} />
        <Route path="/Contact" element={<Contact />} />
        <Route path="/Upload" element={<Upload />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
