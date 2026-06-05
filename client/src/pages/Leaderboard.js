import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const LEVEL_COLORS = {
    Basic: '#a0aec0',
    Silver: '#e2e8f0',
    Gold: '#fbbf24',
    Legend: '#f43f5e'
};

function Leaderboard() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/auth/leaderboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeaders(res.data.leaders);
        } catch (error) {
            toast.error('Failed to fetch leaderboard');
        }
        setLoading(false);
    };

    const getRankStyle = (index) => {
        if (index === 0) return { background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))', border: '1px solid rgba(251,191,36,0.3)', boxShadow: '0 0 20px rgba(251,191,36,0.1)' };
        if (index === 1) return { background: 'linear-gradient(135deg, rgba(226,232,240,0.15), rgba(226,232,240,0.05))', border: '1px solid rgba(226,232,240,0.2)' };
        if (index === 2) return { background: 'linear-gradient(135deg, rgba(217,119,6,0.15), rgba(217,119,6,0.05))', border: '1px solid rgba(217,119,6,0.2)' };
        return { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' };
    };

    const getRankIcon = (index) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return <span style={{ opacity: 0.5, fontSize: '18px' }}>#{index + 1}</span>;
    };

    const localities = ['All', ...new Set(leaders.map(l => l.locality))];
    const filteredLeaders = filter === 'All'
        ? leaders
        : leaders.filter(l => l.locality === filter);

    return (
        <div className="page-container" style={S.container}>
            <nav style={S.nav}>
                <h1 style={S.logo}>🏙️ CivicConnect</h1>
                <div style={S.navRight}>
                    {user && (
                        <span style={S.pointsPill}>🏆 {user.points || 0} pts</span>
                    )}
                    <button className="btn-secondary" onClick={() => navigate('/dashboard')}>↩ Dashboard</button>
                    <button className="btn-primary" onClick={() => navigate('/departments')}>+ Report Issue</button>
                </div>
            </nav>

            <div style={S.content}>
                <div style={S.header}>
                    <h2 style={S.pageTitle}>🏆 Civic Leaderboard</h2>
                    <p style={S.pageSubtitle}>
                        Honoring the top contributors resolving community issues
                    </p>
                </div>

                {/* Current User Rank */}
                {user && (
                    <div className="glass-card" style={S.myRankCard}>
                        <div style={S.myRankStart}>
                            <span style={S.myRankLabel}>Your Current Standing</span>
                            <div style={S.myRankInfo}>
                                <div style={S.myAvatar}>{user.avatar}</div>
                                <div>
                                    <p style={S.myName}>{user.name}</p>
                                    <p style={S.myPoints}>🏆 <span style={{color:'var(--secondary)'}}>{user.points || 0} pts</span></p>
                                </div>
                            </div>
                        </div>
                        <div style={S.myPosition}>
                            #{leaders.findIndex(l => l._id === user.id) + 1 || '?'}
                        </div>
                    </div>
                )}

                {/* Locality Filter */}
                <div style={S.filters}>
                    {localities.map(locality => {
                        const active = filter === locality;
                        return (
                            <button key={locality} style={{
                                ...S.filterBtn,
                                background: active ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                color: active ? 'white' : 'rgba(255,255,255,0.7)',
                                border: active ? '1px solid var(--primary-glow)' : '1px solid rgba(255,255,255,0.1)',
                                boxShadow: active ? '0 0 10px var(--primary-glow)' : 'none',
                            }} onClick={() => setFilter(locality)}>
                                {locality === 'All' ? '🌍 Global' : `📍 ${locality}`}
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <p style={S.loading}>Loading rankings...</p>
                ) : filteredLeaders.length === 0 ? (
                    <p style={S.loading}>No civic heroes found in this area yet.</p>
                ) : (
                    <div className="glass-card" style={S.leadersListCard}>
                        {filteredLeaders.map((leader, index) => {
                            const avatarColor = LEVEL_COLORS[leader.avatarLevel] || LEVEL_COLORS.Basic;
                            return (
                                <div key={leader._id} style={{ ...S.leaderRow, ...getRankStyle(index) }}>
                                    <span style={S.rankText}>{getRankIcon(index)}</span>
                                    
                                    <div style={{ ...S.leaderAvatarWrap, border: `2px solid ${avatarColor}` }}>
                                        {leader.avatar}
                                    </div>
                                    
                                    <div style={S.leaderInfo}>
                                        <p style={S.leaderName}>{leader.name}</p>
                                        <p style={S.leaderLocality}>📍 {leader.locality}</p>
                                    </div>
                                    
                                    <div style={S.leaderStats}>
                                        <p style={S.leaderPoints}>{leader.points} <span style={{fontSize:'12px', opacity:0.6}}>pts</span></p>
                                        <p style={{...S.leaderLevel, color: avatarColor}}>{leader.avatarLevel}</p>
                                    </div>
                                </div>
                            );
                        })}
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
        padding: '24px 40px', background: 'rgba(255,255,255,0.02)', backdropFilter:'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)', position:'sticky', top:0, zIndex:100,
    },
    logo: { margin: 0, fontSize: '26px', color: '#fff', fontWeight:800 },
    navRight: { display: 'flex', alignItems: 'center', gap: '14px' },
    pointsPill: {
        background: 'rgba(0,0,0,0.5)', padding: '8px 16px',
        borderRadius: '20px', fontSize: '14px', color: '#fbbf24', fontWeight: 700,
        border: '1px solid rgba(251,191,36,0.3)',
    },
    content: { padding: '40px 20px', maxWidth: '800px', margin: '0 auto' },
    header: { textAlign: 'center', marginBottom: '32px' },
    pageTitle: { color: '#fff', fontSize: '36px', fontWeight: 800, margin: '0 0 8px', textShadow: '0 0 20px rgba(255,255,255,0.3)' },
    pageSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: '16px', margin: 0 },
    
    myRankCard: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px 32px', marginBottom: '32px', borderLeft: '4px solid var(--secondary)',
    },
    myRankStart: { display: 'flex', flexDirection: 'column', gap: '12px' },
    myRankLabel: { fontSize: '13px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 },
    myRankInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
    myAvatar: { width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: '2px solid rgba(255,255,255,0.2)' },
    myName: { margin: '0 0 4px', fontWeight: 700, fontSize: '20px', color: '#fff' },
    myPoints: { margin: 0, fontSize: '15px', fontWeight: 600 },
    myPosition: { fontSize: '48px', fontWeight: 800, color: '#fff', textShadow: '0 0 20px rgba(255,255,255,0.5)', lineHeight: 1 },
    
    filters: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px', justifyContent: 'center' },
    filterBtn: {
        padding: '10px 20px', borderRadius: '24px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all 0.3s ease',
    },
    
    loading: { textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '40px', fontSize: '16px' },
    
    leadersListCard: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' },
    leaderRow: {
        borderRadius: '16px', padding: '16px 24px',
        display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.2s',
    },
    rankText: { fontSize: '28px', minWidth: '40px', textAlign: 'center', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' },
    leaderAvatarWrap: {
        width: '48px', height: '48px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '24px', background: 'rgba(255,255,255,0.05)',
    },
    leaderInfo: { flex: 1 },
    leaderName: { margin: '0 0 4px', fontWeight: 700, fontSize: '18px', color: '#fff' },
    leaderLocality: { margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)' },
    leaderStats: { textAlign: 'right' },
    leaderPoints: { margin: '0 0 4px', fontWeight: 800, fontSize: '22px', color: '#fff' },
    leaderLevel: { margin: 0, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' },
};

export default Leaderboard;
