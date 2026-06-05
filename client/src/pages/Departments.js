import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DEPT_INFO = {
  Water:       { icon: '💧', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)', desc: 'Leakages, supply issues, contamination' },
  Electricity: { icon: '⚡', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', desc: 'Power cuts, broken poles, street lights' },
  Waste:       { icon: '🗑️', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', desc: 'Garbage, dumping, drainage overflow' },
  Roads:       { icon: '🛣️', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', desc: 'Potholes, broken roads, flooding' },
  Sanitation:  { icon: '🧹', color: '#2dd4bf', bg: 'rgba(45, 212, 191, 0.15)', desc: 'Sewage, public toilets, cleanliness' },
  Other:       { icon: '📋', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', desc: 'Any other civic issues' },
};

export default function Departments() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [deptStats, setDeptStats] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/departments?locality=${encodeURIComponent(user.locality)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data && res.data.departments) {
        setDeptStats(res.data.departments);
      }
    } catch (err) {
      console.error('Departments fetch error:', err.message);
    }
    setLoading(false);
  };

  const getStat = (dept) => deptStats.find(d => d.department === dept) || { total:0, pending:0, progress:0, resolved:0 };

  return (
    <div className="page-container" style={S.page}>
      {/* Nav */}
      <div style={S.nav}>
        <div style={S.navLeft}>
          <button className="btn-secondary" onClick={() => navigate('/dashboard')}>← Back</button>
          <h1 style={S.logo}>🏙️ CivicConnect</h1>
        </div>
        <div style={S.navRight}>
          <span className="shiny-badge" style={S.userPill}>{user?.avatar} {user?.name}</span>
        </div>
      </div>

      {/* Header */}
      <div style={S.header}>
        <h2 style={S.title}>Select Department</h2>
        <p style={S.sub}>Choose the department that best fits your issue to file a complaint or see existing ones in <strong style={{color: '#fff'}}>{user?.locality}</strong></p>
      </div>

      {/* Department grid */}
      {loading ? (
        <div style={S.loading}>Loading departments...</div>
      ) : (
        <div style={S.grid}>
          {Object.entries(DEPT_INFO).map(([dept, info]) => {
            const stat = getStat(dept);
            return (
              <div
                key={dept}
                className="glass-card"
                style={{ ...S.card, borderTop: `4px solid ${info.color}`, boxShadow: `0 8px 32px ${info.bg}` }}
                onClick={() => navigate(`/department/${dept}`)}
              >
                <div style={{ ...S.iconWrap, background: info.bg, border: `1px solid ${info.color}40` }}>
                  <span style={S.icon}>{info.icon}</span>
                </div>
                <h3 style={{ ...S.deptName, color: info.color, textShadow: `0 0 10px ${info.color}40` }}>{dept}</h3>
                <p style={S.deptDesc}>{info.desc}</p>

                <div style={S.stats}>
                  <div style={S.statItem}>
                    <span style={{ ...S.statNum, color: '#ef4444' }}>{stat.pending}</span>
                    <span style={S.statLabel}>Pending</span>
                  </div>
                  <div style={S.statItem}>
                    <span style={{ ...S.statNum, color: '#3b82f6' }}>{stat.progress}</span>
                    <span style={S.statLabel}>In Progress</span>
                  </div>
                  <div style={S.statItem}>
                    <span style={{ ...S.statNum, color: '#10b981' }}>{stat.resolved}</span>
                    <span style={S.statLabel}>Resolved</span>
                  </div>
                </div>

                {stat.emergency > 0 && (
                  <div className="shiny-badge" style={S.emergencyBadge}>🚨 {stat.emergency} Emergency</div>
                )}

                <button className="btn-primary" style={{ ...S.viewBtn, background: `linear-gradient(135deg, ${info.color}, transparent)`, borderColor: info.color }}>
                  View & Report →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const S = {
  page:    { paddingBottom:'80px' },
  nav:     { background:'rgba(255,255,255,0.02)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'24px 40px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  navLeft: { display:'flex', alignItems:'center', gap:20 },
  navRight:{ display:'flex', alignItems:'center', gap:12 },
  logo:    { margin:0, color:'#fff', fontSize:26, fontWeight:800, textShadow:'0 0 15px rgba(255,255,255,0.2)' },
  userPill:{},

  header:  { textAlign:'center', padding:'60px 20px 40px' },
  title:   { fontSize:42, fontWeight:800, color:'#fff', margin:'0 0 16px', textShadow:'0 0 20px rgba(255,255,255,0.3)' },
  sub:     { color:'rgba(255,255,255,0.7)', fontSize:18, margin:0, maxWidth:'600px', marginLeft:'auto', marginRight:'auto', lineHeight:'1.5' },

  loading: { textAlign:'center', padding:'60px', color:'rgba(255,255,255,0.6)', fontSize:18 },

  grid:    { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:32, padding:'0 40px 60px', maxWidth:1200, margin:'0 auto' },

  card:    {
    padding:32, cursor:'pointer',
    display:'flex', flexDirection:'column', gap:16,
    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s'
  },
  iconWrap:{ width:70, height:70, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8 },
  icon:    { fontSize:32 },
  deptName:{ margin:0, fontSize:22, fontWeight:800 },
  deptDesc:{ margin:0, color:'rgba(255,255,255,0.7)', fontSize:14, lineHeight:1.5 },

  stats:   { display:'flex', gap:20, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.05)', marginTop:'auto' },
  statItem:{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:4 },
  statNum: { fontSize:24, fontWeight:800 },
  statLabel:{ fontSize:12, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:1 },

  emergencyBadge:{ color:'#ef4444', borderColor:'#ef4444', alignSelf:'flex-start', marginTop:12 },

  viewBtn: { padding:'12px 0', fontSize:15, marginTop:20, width:'100%' },
};
