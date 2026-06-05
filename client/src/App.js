import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SubmitComplaint from './pages/SubmitComplaint';
import PublicFeed from './pages/PublicFeed';
import ComplaintProgress from './pages/ComplaintProgress';
import AvatarProfile from './pages/AvatarProfile';
import Leaderboard from './pages/Leaderboard';
import ChatHistory from './pages/ChatHistory';
import Departments from './pages/Departments';
import DepartmentDetail from './pages/DepartmentDetail';
import AdminDashboard from './pages/AdminDashboard';
import AIAssistant from './components/AIAssistant';

function App() {
  const { loading } = useAuth();
  const [voiceFormData,     setVoiceFormData]     = useState(null);
  const [triggerImagePicker,setTriggerImagePicker] = useState(false);

  if (loading) {
    return (
      <div style={{ display:'flex', minHeight:'100vh', alignItems:'center', justifyContent:'center', background:'#0a0a1a', color:'#fff', flexDirection:'column', gap:'20px' }}>
         <div style={{ width:'40px', height:'40px', border:'3px solid rgba(255,255,255,0.1)', borderTopColor:'#f43f5e', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
         <h2 style={{ margin:0, fontSize:'24px', fontWeight:800, textShadow:'0 0 15px rgba(255,255,255,0.3)', letterSpacing:'1px' }}>CivicConnect</h2>
         <p style={{ margin:0, color:'rgba(255,255,255,0.5)', fontSize:'14px', textTransform:'uppercase', letterSpacing:'2px' }}>Loading Session...</p>
         <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <AIAssistant
        onFormFill={(data) => setVoiceFormData(data)}
        onImageRequest={() => setTriggerImagePicker(true)}
      />
      <Routes>
        <Route path="/"                    element={<Home />} />
        <Route path="/login"               element={<Login />} />
        <Route path="/register"            element={<Register voiceData={voiceFormData} />} />
        <Route path="/dashboard"           element={<Dashboard />} />
        <Route path="/submit"              element={
          <SubmitComplaint
            voiceData={voiceFormData}
            triggerImagePicker={triggerImagePicker}
            onImagePickerDone={() => setTriggerImagePicker(false)}
          />}
        />
        <Route path="/feed"                element={<PublicFeed />} />
        <Route path="/complaint/:id"       element={<ComplaintProgress />} />
        <Route path="/avatar"              element={<AvatarProfile />} />
        <Route path="/leaderboard"         element={<Leaderboard />} />
        <Route path="/chat-history"        element={<ChatHistory />} />
        <Route path="/departments"         element={<Departments />} />
        <Route path="/department/:department" element={<DepartmentDetail />} />
        <Route path="/admin"               element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;