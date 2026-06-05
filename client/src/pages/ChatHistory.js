import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ChatHistory() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState(null);

    useEffect(() => {
        fetchChatHistory();
    }, []);

    const fetchChatHistory = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/chat/history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setChats(data.chats);
            if (data.chats.length > 0) setSelectedChat(data.chats[0]);
        } catch (error) {
            console.log('Error fetching chat history');
        }
        setLoading(false);
    };

    const speak = (text) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="page-container" style={S.container}>
            <nav style={S.nav}>
                <h1 style={S.logo}>🏙️ CivicConnect</h1>
                <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                    ← Back to Dashboard
                </button>
            </nav>

            <div style={S.content}>
                <h2 style={S.pageTitle}>💬 Chat History</h2>
                <p style={S.subtitle}>All your conversations with the AI Assistant</p>

                {loading ? (
                    <p style={S.loading}>Loading...</p>
                ) : chats.length === 0 ? (
                    <p style={S.loading}>No chat history yet. Talk to the AI Assistant!</p>
                ) : (
                    <div style={S.layout}>
                        {/* Sessions list */}
                        <div className="glass-card" style={S.sessionsList}>
                            <h3 style={S.sessionsTitle}>Sessions</h3>
                            {chats.map((chat, i) => (
                                <div
                                    key={chat._id}
                                    style={{
                                        ...S.sessionCard,
                                        background: selectedChat?._id === chat._id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                        color: selectedChat?._id === chat._id ? 'white' : 'rgba(255,255,255,0.8)',
                                    }}
                                    onClick={() => setSelectedChat(chat)}
                                >
                                    <p style={S.sessionDate}>
                                        📅 {new Date(chat.createdAt).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </p>
                                    <p style={S.sessionCount}>
                                        {chat.messages.length} messages
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Messages */}
                        {selectedChat && (
                            <div className="glass-card" style={S.messagesPanel}>
                                <h3 style={S.messagesTitle}>
                                    Conversation on {new Date(selectedChat.createdAt).toLocaleDateString('en-IN', {
                                        day: 'numeric', month: 'long', year: 'numeric'
                                    })}
                                </h3>
                                <div style={S.messagesList}>
                                    {selectedChat.messages.map((msg, i) => (
                                        <div key={i} style={{
                                            ...S.message,
                                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                            background: msg.role === 'user' ? 'linear-gradient(135deg, var(--primary), #8a2be2)' : 'rgba(255,255,255,0.05)',
                                            color: 'white',
                                        }}>
                                            <div style={S.messageHeader}>
                                                <span style={S.messageRole}>
                                                    {msg.role === 'user' ? '👤 You' : '🤖 AI'}
                                                </span>
                                                <span style={S.messageTime}>
                                                    {new Date(msg.timestamp).toLocaleTimeString('en-IN', {
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                                {msg.role === 'assistant' && (
                                                    <button
                                                        style={S.speakBtn}
                                                        onClick={() => speak(msg.text)}
                                                    >
                                                        🔊
                                                    </button>
                                                )}
                                            </div>
                                            <p style={S.messageText}>{msg.text}</p>
                                            {msg.language && msg.language !== 'en-IN' && (
                                                <span className="shiny-badge" style={S.langTag}>{msg.language}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

const S = {
    container: { paddingBottom: '80px' },
    nav: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '24px 40px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white',
    },
    logo: { margin: 0, fontSize: '26px', color: '#fff', fontWeight: 800, textShadow: '0 0 15px rgba(255,255,255,0.3)' },
    content: { padding: '40px', maxWidth: '1000px', margin: '0 auto' },
    pageTitle: { color: '#fff', marginBottom: '8px', fontSize: '28px', textShadow: '0 0 10px rgba(255,255,255,0.2)' },
    subtitle: { color: 'rgba(255,255,255,0.6)', marginBottom: '32px' },
    loading: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '40px' },
    layout: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' },
    sessionsList: {
        padding: '24px', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '12px',
    },
    sessionsTitle: { color: '#fff', margin: '0 0 8px', fontSize: '18px' },
    sessionCard: {
        padding: '16px', borderRadius: '12px', cursor: 'pointer',
        transition: 'all 0.3s', border: '1px solid rgba(255,255,255,0.05)'
    },
    sessionDate: { margin: '0 0 4px', fontWeight: 'bold', fontSize: '15px' },
    sessionCount: { margin: 0, fontSize: '13px', opacity: 0.7 },
    messagesPanel: {
        padding: '24px', display: 'flex', flexDirection: 'column',
    },
    messagesTitle: { color: '#fff', margin: '0 0 20px', fontSize: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' },
    messagesList: {
        display: 'flex', flexDirection: 'column',
        gap: '16px', maxHeight: '600px', overflowY: 'auto', paddingRight: '10px'
    },
    message: {
        padding: '14px 18px', borderRadius: '16px',
        maxWidth: '85%', border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
    },
    messageHeader: {
        display: 'flex', alignItems: 'center',
        gap: '10px', marginBottom: '8px',
    },
    messageRole: { fontWeight: '700', fontSize: '13px', color: 'rgba(255,255,255,0.9)' },
    messageTime: { fontSize: '12px', color: 'rgba(255,255,255,0.6)' },
    speakBtn: {
        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '28px', height: '28px',
        cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', marginLeft: 'auto'
    },
    messageText: { margin: 0, fontSize: '15px', lineHeight: '1.6', color: 'rgba(255,255,255,0.95)' },
    langTag: {
        display: 'inline-block', marginTop: '10px',
        background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)',
    },
};

export default ChatHistory;