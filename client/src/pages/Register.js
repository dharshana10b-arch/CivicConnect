import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const AVATARS = ['🦁', '🐯', '🦊', '🐺', '🦅', '🦋', '🐬', '🦄'];

function Register({ voiceData }) {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', locality: '', avatar: ''
    });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const processedVoice = React.useRef(null);

    useEffect(() => {
        if (voiceData && JSON.stringify(voiceData) !== processedVoice.current) {
            processedVoice.current = JSON.stringify(voiceData);
            if (voiceData.name) setFormData(prev => ({ ...prev, name: voiceData.name }));
            if (voiceData.email) setFormData(prev => ({ ...prev, email: voiceData.email }));
            if (voiceData.password) setFormData(prev => ({ ...prev, password: voiceData.password }));
            if (voiceData.locality) setFormData(prev => ({ ...prev, locality: voiceData.locality }));
            if (voiceData.avatar) setFormData(prev => ({ ...prev, avatar: voiceData.avatar }));
            if (voiceData.submit) {
                setTimeout(() => {
                    const fakeEvent = { preventDefault: () => {} };
                    handleSubmit(fakeEvent);
                }, 100);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [voiceData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const selectAvatar = (avatar) => {
        setFormData({ ...formData, avatar });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.avatar) {
            toast.error('Please select an avatar!');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', formData);
            login(res.data.user, res.data.token);
            toast.success('Registration successful!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        }
        setLoading(false);
    };

    return (
        <div className="page-container" style={S.container}>
            <div className="glass-card" style={S.card}>
                <div style={S.header}>
                    <h1 style={S.title}>🏙️ CivicConnect</h1>
                    <h2 style={S.subtitle}>Citizen Registration</h2>
                    <p style={S.subtext}>Join your community to report and vote on civic issues.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={S.inputGroup}>
                        <div style={S.field}>
                            <label style={S.label}>Full Name</label>
                            <input className="sleek-input" type="text" name="name" placeholder="John Doe"
                                value={formData.name} onChange={handleChange} required />
                        </div>
                        <div style={S.field}>
                            <label style={S.label}>Locality</label>
                            <input className="sleek-input" type="text" name="locality" placeholder="e.g. Downtown"
                                value={formData.locality} onChange={handleChange} required />
                        </div>
                    </div>

                    <div style={S.field}>
                        <label style={S.label}>Email Address</label>
                        <input className="sleek-input" type="email" name="email" placeholder="john@example.com"
                            value={formData.email} onChange={handleChange} required />
                    </div>
                    
                    <div style={S.field}>
                        <label style={S.label}>Password</label>
                        <input className="sleek-input" type="password" name="password" placeholder="Create a strong password"
                            value={formData.password} onChange={handleChange} required />
                    </div>

                    <div style={S.field}>
                        <label style={S.label}>Choose Your Civic Avatar</label>
                        <div style={S.avatarGrid}>
                            {AVATARS.map((avatar) => {
                                const active = formData.avatar === avatar;
                                return (
                                    <div key={avatar}
                                        style={{
                                            ...S.avatarItem,
                                            background: active ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                            border: active ? '1px solid var(--primary-glow)' : '1px solid rgba(255,255,255,0.1)',
                                            transform: active ? 'scale(1.1)' : 'scale(1)',
                                            boxShadow: active ? '0 0 15px var(--primary-glow)' : 'none',
                                        }}
                                        onClick={() => selectAvatar(avatar)}
                                    >
                                        {avatar}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button className="btn-primary" style={S.button} type="submit" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Register as Citizen'}
                    </button>
                </form>
                
                <p style={S.linkWrap}>
                    Already have an account? <Link to="/login" style={S.link}>Secure Login</Link>
                </p>
                <p style={S.linkWrap}>
                    <Link to="/" style={S.linkBack}>← Return to Home</Link>
                </p>
            </div>
        </div>
    );
}

const S = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
    },
    card: {
        padding: '48px 40px',
        width: '100%',
        maxWidth: '520px',
    },
    header: {
        textAlign: 'center',
        marginBottom: '32px',
    },
    title: {
        color: '#fff',
        margin: '0 0 8px',
        fontSize: '28px',
        fontWeight: '800',
    },
    subtitle: {
        color: 'var(--primary)',
        margin: '0 0 8px',
        fontSize: '20px',
    },
    subtext: {
        color: 'rgba(255,255,255,0.6)',
        margin: 0,
        fontSize: '14px',
    },
    inputGroup: {
        display: 'flex',
        gap: '16px',
    },
    field: {
        flex: 1,
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: '8px',
        fontSize: '13px',
        fontWeight: '500',
    },
    avatarGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: '8px',
    },
    avatarItem: {
        padding: '10px 0',
        borderRadius: '12px',
        textAlign: 'center',
        fontSize: '24px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    button: {
        width: '100%',
        padding: '16px',
        fontSize: '16px',
        marginTop: '12px',
    },
    linkWrap: {
        textAlign: 'center',
        marginTop: '20px',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '14px',
    },
    link: {
        color: 'var(--primary)',
        textDecoration: 'none',
        fontWeight: '600',
    },
    linkBack: {
        color: 'rgba(255,255,255,0.8)',
        textDecoration: 'none',
        borderBottom: '1px dashed rgba(255,255,255,0.4)',
    }
};

export default Register;
