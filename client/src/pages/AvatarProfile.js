import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const AVATARS = ['🦁', '🐯', '🦊', '🐺', '🦅', '🦋', '🐬', '🦄', '🐼', '🐧'];

const LEVELS = {
    Basic: {
        label: 'Basic',
        color: '#a0aec0',
        badge: '🌱',
        pointsNeeded: 0,
        nextLevel: 'Silver',
        nextPoints: 51
    },
    Silver: {
        label: 'Silver',
        color: '#e2e8f0',
        badge: '⭐',
        pointsNeeded: 51,
        nextLevel: 'Gold',
        nextPoints: 101
    },
    Gold: {
        label: 'Gold',
        color: '#fbbf24',
        badge: '🌟',
        pointsNeeded: 101,
        nextLevel: 'Legend',
        nextPoints: 201
    },
    Legend: {
        label: 'Legend',
        color: '#f43f5e',
        badge: '👑',
        pointsNeeded: 201,
        nextLevel: null,
        nextPoints: null
    }
};

function AvatarProfile() {
    const { user, token, login } = useAuth();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserData(res.data.user);
        } catch (error) {
            toast.error('Failed to fetch profile');
        }
        setLoading(false);
    };

    const updateAvatar = async (newAvatar) => {
        if (updating || userData.avatar === newAvatar) return;
        setUpdating(true);
        try {
            const res = await axios.put(
                'http://localhost:5000/api/auth/update-avatar',
                { avatar: newAvatar },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUserData(res.data.user);
            login(res.data.user, token);
            toast.success('Avatar updated successfully!');
        } catch (error) {
            toast.error('Failed to update avatar');
        }
        setUpdating(false);
    };

    if (loading) return <p style={S.loading}>Loading profile data...</p>;
    if (!userData) return null;

    const level = LEVELS[userData.avatarLevel] || LEVELS.Basic;
    const progressToNext = level.nextPoints
        ? Math.min(((userData.points - level.pointsNeeded) / (level.nextPoints - level.pointsNeeded)) * 100, 100)
        : 100;

    return (
        <div className="page-container" style={S.container}>
            <nav style={S.nav}>
                <h1 style={S.logo}>🏙️ CivicConnect</h1>
                <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                    ← Back to Dashboard
                </button>
            </nav>

            <div style={S.content}>
                
                {/* Main Identity Card */}
                <div className="glass-card" style={S.profileCard}>
                    <div style={{
                        ...S.avatarDisplay,
                        border: `4px solid ${level.color}`,
                        boxShadow: `0 0 30px ${level.color}40`,
                    }}>
                        <span style={S.avatarEmoji}>{userData.avatar}</span>
                    </div>
                    <span style={{...S.levelBadge, border:`1px solid ${level.color}80`}}>
                        {level.badge} <span style={{color:level.color}}>{level.label} Status</span>
                    </span>
                    <h2 style={S.userName}>{userData.name}</h2>
                    <p style={S.userLocality}>📍 Stationed in {userData.locality}</p>

                    <div style={S.pointsBox}>
                        <h3 style={S.pointsNumber}>🏆 {userData.points}</h3>
                        <p style={S.pointsLabel}>Total Civic Points</p>
                    </div>

                    {/* Progress Bar */}
                    {level.nextLevel ? (
                        <div style={S.progressBox}>
                            <p style={S.progressLabel}>
                                Progress to {level.nextLevel}: <strong>{userData.points}</strong> / {level.nextPoints} pts
                            </p>
                            <div style={S.progressBar}>
                                <div style={{
                                    ...S.progressFill,
                                    width: `${progressToNext}%`,
                                    background: `linear-gradient(90deg, var(--primary), ${level.color})`,
                                    boxShadow: `0 0 10px ${level.color}`
                                }} />
                            </div>
                        </div>
                    ) : (
                        <div style={S.legendBox}>
                            👑 You are a Legendary Civic Hero! Maximum rank achieved.
                        </div>
                    )}
                </div>

                <div style={S.bottomGrid}>
                    {/* Progression Guide */}
                    <div className="glass-card" style={S.levelsCard}>
                        <h3 style={S.cardTitle}>Ranking System</h3>
                        {Object.entries(LEVELS).map(([key, lvl]) => {
                            const isCurrent = userData.avatarLevel === key;
                            return (
                                <div key={key} style={{
                                    ...S.levelRow,
                                    background: isCurrent ? 'rgba(255,255,255,0.05)' : 'transparent',
                                    border: isCurrent ? `1px solid ${lvl.color}` : '1px solid rgba(255,255,255,0.05)',
                                }}>
                                    <span style={{fontSize:'28px', filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'}}>{lvl.badge}</span>
                                    <div style={S.levelInfo}>
                                        <p style={{ ...S.levelName, color: lvl.color }}>{lvl.label}</p>
                                        <p style={S.levelPoints}>{lvl.pointsNeeded}+ points</p>
                                    </div>
                                    {isCurrent && <span style={{...S.currentBadge, color:lvl.color, border:`1px solid ${lvl.color}`}}>Current</span>}
                                </div>
                            );
                        })}
                    </div>

                    {/* Avatar Selection */}
                    <div className="glass-card" style={S.changeAvatarCard}>
                        <h3 style={S.cardTitle}>Select Identity</h3>
                        <p style={{color:'rgba(255,255,255,0.6)', fontSize:'13px', margin:'-10px 0 16px'}}>Choose your civic avatar to represent you on the community board.</p>
                        <div style={S.avatarGrid}>
                            {AVATARS.map(avatar => {
                                const active = userData.avatar === avatar;
                                return (
                                    <div
                                        key={avatar}
                                        style={{
                                            ...S.avatarOption,
                                            border: active ? `2px solid var(--primary)` : '1px solid rgba(255,255,255,0.1)',
                                            background: active ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)',
                                            transform: active ? 'scale(1.1)' : 'scale(1)',
                                            boxShadow: active ? '0 0 15px var(--primary-glow)' : 'none',
                                            opacity: updating ? 0.5 : 1,
                                            cursor: updating ? 'not-allowed' : 'pointer'
                                        }}
                                        onClick={() => updateAvatar(avatar)}
                                    >
                                        {avatar}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const S = {
    container: { paddingBottom:'80px' },
    nav: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '24px 40px', background: 'rgba(255,255,255,0.02)', backdropFilter:'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)', position:'sticky', top:0, zIndex:100,
    },
    logo: { margin: 0, fontSize: '26px', color: '#fff', fontWeight:800 },
    loading: { textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.6)', fontSize:'16px' },
    content: {
        padding: '40px 20px', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px',
    },
    
    profileCard: {
        padding: '48px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden'
    },
    avatarDisplay: {
        width: '120px', height: '120px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px', background: 'rgba(0,0,0,0.3)',
    },
    avatarEmoji: { fontSize: '64px', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' },
    levelBadge: {
        display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 16px',
        borderRadius: '24px', background: 'rgba(0,0,0,0.4)',
        color: '#fff', fontSize: '13px', marginBottom: '16px', fontWeight: 600, letterSpacing: '1px', textTransform:'uppercase'
    },
    userName: { color: '#fff', margin: '0 0 8px', fontSize: '32px', fontWeight: 800 },
    userLocality: { color: 'rgba(255,255,255,0.6)', margin: '0 0 24px', fontSize: '15px' },
    
    pointsBox: {
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px', padding: '20px 40px', marginBottom: '32px',
    },
    pointsNumber: { color: '#fbbf24', fontSize: '42px', margin: '0 0 4px', fontWeight: 800, textShadow: '0 0 20px rgba(251,191,36,0.3)', lineHeight:1 },
    pointsLabel: { color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 },
    
    progressBox: { width: '100%', maxWidth: '500px', background:'rgba(0,0,0,0.2)', padding:'16px 20px', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.05)' },
    progressLabel: { color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '12px', textAlign: 'left' },
    progressBar: { background: 'rgba(0,0,0,0.5)', borderRadius: '10px', height: '12px', overflow: 'hidden', border:'1px solid rgba(255,255,255,0.1)' },
    progressFill: { height: '100%', borderRadius: '10px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' },
    
    legendBox: {
        padding: '16px 24px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
        color: '#f43f5e', fontWeight: 700, borderRadius: '12px',
    },

    bottomGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'start' },
    
    levelsCard: { padding: '32px' },
    cardTitle: { color: '#fff', fontSize: '20px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' },
    levelRow: {
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '16px', borderRadius: '12px', marginBottom: '12px', transition: 'all 0.2s',
    },
    levelInfo: { flex: 1 },
    levelName: { margin: '0 0 4px', fontWeight: 700, fontSize: '16px', textTransform:'uppercase', letterSpacing:'1px' },
    levelPoints: { margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)' },
    currentBadge: {
        background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase'
    },
    
    changeAvatarCard: { padding: '32px' },
    avatarGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' },
    avatarOption: {
        padding: '16px 0', borderRadius: '16px', textAlign: 'center',
        fontSize: '36px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
};

export default AvatarProfile;
