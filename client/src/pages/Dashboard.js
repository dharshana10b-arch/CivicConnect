import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { Tilt } from 'react-tilt';
import { motion } from 'framer-motion';

const SEV_COLOR = { Low:'#43a047', Medium:'#ffc107', High:'#ff7043', Emergency:'#e53935' };
const STA_COLOR = { Pending:'#ffc107', 'In Progress':'#1976d2', Resolved:'#43a047' };

const LEVEL_INFO = {
  Basic:  { badge:'🌱', color:'#a0aec0', border:'2px solid rgba(255,255,255,0.2)' },
  Silver: { badge:'⭐', color:'#e2e8f0', border:'2px solid #e2e8f0' },
  Gold:   { badge:'🌟', color:'#fbbf24', border:'2px solid #fbbf24', shadow:'0 0 10px rgba(251,191,36,0.6)' },
  Legend: { badge:'👑', color:'#f43f5e', border:'2px solid #f43f5e', shadow:'0 0 15px rgba(244,63,94,0.8)' },
};

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [myComplaints,   setMyComplaints]   = useState([]);
  const [communityFeed,  setCommunityFeed]  = useState([]);
  const [topScorers,     setTopScorers]     = useState([]);
  const [communityMsgs,  setCommunityMsgs]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeTab,      setActiveTab]      = useState('my');

  const level = LEVEL_INFO[user?.avatarLevel] || LEVEL_INFO.Basic;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const headers = { Authorization:`Bearer ${token}` };
      const loc     = encodeURIComponent(user.locality);

      const [myRes, commRes, topRes, msgRes] = await Promise.all([
        axios.get('http://localhost:5000/api/complaints/my', { headers }),
        axios.get(`http://localhost:5000/api/departments/community/complaints?locality=${loc}`, { headers }),
        axios.get(`http://localhost:5000/api/departments/community/top-scorers?locality=${loc}`, { headers }),
        axios.get(`http://localhost:5000/api/departments/community/messages?locality=${loc}`, { headers }),
      ]);

      setMyComplaints(myRes.data.complaints  || []);
      setCommunityFeed(commRes.data.complaints || []);
      setTopScorers(topRes.data.topUsers     || []);
      setCommunityMsgs(msgRes.data.messages  || []);
    } catch (_) {
      toast.error('Failed to load dashboard');
    }
    setLoading(false);
  };

  const handleVote = async (id, type) => {
    try {
      await axios.post(`http://localhost:5000/api/complaints/${id}/vote`,
        { voteType:type }, { headers:{ Authorization:`Bearer ${token}` } });
      toast.success('Vote recorded!');
      fetchAll();
    } catch (_) { toast.error('Failed to vote'); }
  };

  const stats = {
    total:    myComplaints.length,
    resolved: myComplaints.filter(c => c.status==='Resolved').length,
    pending:  myComplaints.filter(c => c.status==='Pending').length,
    points:   user?.points || 0,
  };

  return (
    <div className="page-container" style={S.page}>
      {/* Premium Glass Nav */}
      <div style={S.nav}>
        <h1 style={S.logo}>🏙️ CivicConnect</h1>
        <div style={S.navRight}>
          <div style={S.pointsPill}>🏆 <span style={{fontWeight:800, color:'#fbbf24'}}>{stats.points}</span> pts</div>
          <div style={{ ...S.avatarWrap, border:level.border, boxShadow:level.shadow||'none' }}
            onClick={() => navigate('/avatar')} title="View Profile">
            <span style={S.avatarEmoji}>{user?.avatar}</span>
          </div>
          <div style={S.userInfo} onClick={() => navigate('/avatar')}>
            <span style={S.levelBadge}>{level.badge} {user?.avatarLevel}</span>
            <span style={S.userName}>{user?.name}</span>
          </div>
          
          <button className="btn-secondary" onClick={() => navigate('/feed')}>🌐 Public Feed</button>
          <button className="btn-secondary" onClick={() => navigate('/leaderboard')}>🏆 Rank</button>
          <button className="btn-primary" onClick={() => navigate('/departments')}>+ Report Issue</button>
          <button style={S.logoutBtn} onClick={() => { logout(); navigate('/'); }}>✕</button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={S.statsRow}>
        {[
          { label:'Total Reports filed', val:stats.total,    color:'var(--primary)' },
          { label:'Issues Resolved',     val:stats.resolved, color:'#10b981' },
          { label:'Pending Actions',     val:stats.pending,  color:'#f59e0b' },
          { label:'Civic Impact Score',  val:stats.points,   color:'var(--secondary)' },
        ].map((s,i) => (
          <motion.div key={i} initial={{opacity:0, y:30}} animate={{opacity:1, y:0}} transition={{delay: i*0.1}}>
            <Tilt options={{ max:15, scale:1.05, speed:400, glare:true, 'max-glare':0.2 }}>
              <div className="glass-card" style={{...S.statCard, height: '100%'}}>
                <span style={{ ...S.statN, color:s.color }}>{s.val}</span>
                <span style={S.statL}>{s.label}</span>
              </div>
            </Tilt>
          </motion.div>
        ))}
      </div>

      <div style={S.body}>
        {/* LEFT COLUMN */}
        <div style={S.leftCol}>
          
          {/* Main Content Tabs */}
          <div className="glass-card" style={S.section}>
            <div style={S.tabRow}>
              <button 
                style={{ ...S.tab, background: activeTab==='my' ? 'var(--primary)' : 'transparent', color: activeTab==='my'?'#fff':'#aaa' }}
                onClick={() => setActiveTab('my')}>
                My Reports ({stats.total})
              </button>
              <button 
                style={{ ...S.tab, background: activeTab==='community' ? 'var(--secondary)' : 'transparent', color: activeTab==='community'?'#fff':'#aaa' }}
                onClick={() => setActiveTab('community')}>
                Community Hub ({communityFeed.length})
              </button>
            </div>

            {loading ? <p style={S.emptyMsg}>Loading smart city data...</p> : (
              <div style={S.complaintList}>
                {(activeTab==='my' ? myComplaints : communityFeed).length === 0 ? (
                  <div style={S.emptyState}>
                    <p style={S.emptyMsg}>{activeTab==='my' ? 'You have no active reports.' : 'No recent complaints in your community.'}</p>
                    <button className="btn-primary" onClick={() => navigate('/departments')}>Take Action & File a Report</button>
                  </div>
                ) : (
                  (activeTab==='my' ? myComplaints : communityFeed).map((c, index) => (
                    <motion.div key={c._id} initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay: index*0.1}}>
                      <Tilt options={{ max:5, scale:1.01, speed:400, parallax:true }}>
                        <div className="glass-card" style={{...S.cCard, borderLeft:`6px solid ${SEV_COLOR[c.severity]}`}}>
                          <div style={S.cTop}>
                            {c.image && <img src={c.image} alt="" style={S.cImg}/>}
                            <div style={S.cBody}>
                              <div style={S.cBadges}>
                                <span className="shiny-badge" style={{color:SEV_COLOR[c.severity], borderColor:SEV_COLOR[c.severity]}}>{c.severity} Priority</span>
                                <span className="shiny-badge" style={{color:STA_COLOR[c.status], borderColor:STA_COLOR[c.status]}}>{c.status}</span>
                                <span className="shiny-badge" style={{color:'#94a3b8'}}>{c.department}</span>
                              </div>
                              <h3 style={S.cTitle} onClick={() => navigate(`/complaint/${c._id}`)}>{c.title}</h3>
                              <p style={S.cDesc}>{c.description?.substring(0,90)}...</p>
                            </div>
                            <div style={S.cScoreBox}>
                               <span style={S.ScoreTitle}>PRIORITY SCORE</span>
                               <span style={S.ScoreVal}>{c.priorityScore}</span>
                            </div>
                          </div>
                          
                          <div style={S.cFooter}>
                            <p style={S.cMeta}>📍 {c.locality} • 🕒 {new Date(c.createdAt).toLocaleDateString()}</p>
                            <div style={S.cActions}>
                              {activeTab==='community' && (
                                <div style={S.voteRow}>
                                  <button style={S.upBtn} onClick={() => handleVote(c._id,'upvote')}>👍 {c.upvotes?.length||0}</button>
                                  <button style={S.downBtn} onClick={() => handleVote(c._id,'downvote')}>👎 {c.downvotes?.length||0}</button>
                                </div>
                              )}
                              <button className="btn-secondary" style={{padding:'6px 14px', fontSize:'13px'}} onClick={() => navigate(`/complaint/${c._id}`)}>View Details →</button>
                            </div>
                          </div>
                        </div>
                      </Tilt>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={S.rightCol}>
          
          {/* Quick department links */}
          <div className="glass-card" style={{...S.section, padding:'24px'}}>
            <h3 style={S.sectionTitle}>🏢 Smart Routing</h3>
            <p style={{color:'rgba(255,255,255,0.6)', fontSize:'13px', margin:'-10px 0 16px', lineHeight:1.4}}>
              Use AI Voice to automatically route issues, or manually select a department target below.
            </p>
            <div style={S.deptGrid}>
              {[
                {dept:'Water',       icon:'💧', color:'#3b82f6'},
                {dept:'Electricity', icon:'⚡', color:'#f59e0b'},
                {dept:'Waste',       icon:'🗑️', color:'#10b981'},
                {dept:'Roads',       icon:'🛣️', color:'#8b5cf6'},
                {dept:'Sanitation',  icon:'🧹', color:'#14b8a6'},
                {dept:'Other',       icon:'📋', color:'#64748b'},
              ].map(d => (
                <button key={d.dept} style={{...S.deptQuick, border:`1px solid ${d.color}40`, background:`${d.color}20`}}
                  onClick={() => navigate(`/department/${d.dept}`)}>
                  <span style={{fontSize:'22px'}}>{d.icon}</span>
                  <span style={{color:'#fff', fontWeight:600}}>{d.dept}</span>
                </button>
              ))}
            </div>
            <button className="btn-primary" style={{width:'100%', marginTop:'16px'}} onClick={() => navigate('/chat-history')}>
              💬 View AI Chat Sync
            </button>
          </div>

          {/* Top Scorers */}
          <div className="glass-card" style={{...S.section, padding:'24px'}}>
            <h3 style={S.sectionTitle}>🏆 Top {user?.locality} Heroes</h3>
            {topScorers.length === 0 ? (
              <p style={S.emptyMsg}>No heroes yet. Claim the #1 spot!</p>
            ) : (
              <div style={S.scorerList}>
                {topScorers.map((u,i) => {
                  const lvl = LEVEL_INFO[u.avatarLevel] || LEVEL_INFO.Basic;
                  return (
                    <div key={u._id} style={S.scorerRow}>
                      <span style={{...S.rank, opacity: i===0?1:0.6}}>{i===0?'🥇':i===1?'🥈':'🥉'}</span>
                      <div style={{ ...S.avatarWrap, border:lvl.border, width:40, height:40 }}>
                        {u.avatar}
                      </div>
                      <div style={S.scorerInfo}>
                        <p style={S.scorerName}>{u.name}</p>
                        <p style={S.scorerLevel}><span style={{color:lvl.color}}>{lvl.badge} {u.avatarLevel}</span></p>
                      </div>
                      <span style={{ ...S.scorerPoints, color:lvl.color, textShadow:lvl.shadow||'none' }}>
                        {u.points} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

const S = {
  page:     { paddingBottom:'80px' },
  nav:      { display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:20, padding:'24px 40px', background:'rgba(255,255,255,0.02)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.05)', position:'sticky', top:0, zIndex:100 },
  logo:     { margin:0, color:'#fff', fontSize:26, fontWeight:800, textShadow:'0 0 15px rgba(255,255,255,0.3)' },
  navRight: { display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' },
  pointsPill:{ background:'rgba(0,0,0,0.5)', border:'1px solid rgba(251,191,36,0.5)', color:'rgba(255,255,255,0.8)', padding:'6px 14px', borderRadius:20, fontSize:14, display:'flex', alignItems:'center', gap:6, boxShadow:'inset 0 0 10px rgba(251,191,36,0.1)' },
  avatarWrap:{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'transform 0.3s' },
  avatarEmoji:{ fontSize:22 },
  userInfo: { display:'flex', flexDirection:'column', cursor:'pointer' },
  userName: { color:'#fff', fontSize:14, fontWeight:600 },
  levelBadge:{ color:'rgba(255,255,255,0.6)', fontSize:11, textTransform:'uppercase', letterSpacing:'1px', marginBottom:'2px' },
  logoutBtn:{ background:'rgba(244,63,94,0.15)', color:'#fb7185', border:'1px solid rgba(244,63,94,0.3)', width:38, height:38, borderRadius:'50%', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' },

  statsRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:24, padding:'40px 40px 20px', maxWidth:1400, margin:'0 auto' },
  statCard: { display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'28px 20px', textAlign:'center' },
  statN:    { fontSize:42, fontWeight:800, textShadow:'0 0 20px currentColor', lineHeight:1 },
  statL:    { fontSize:12, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:1.5, fontWeight:600 },

  body:     { display:'grid', gridTemplateColumns:'2.5fr 1fr', gap:32, padding:'20px 40px', maxWidth:1400, margin:'0 auto', alignItems:'start' },
  leftCol:  { display:'flex', flexDirection:'column', gap:32 },
  rightCol: { display:'flex', flexDirection:'column', gap:32 },

  section:  { display:'flex', flexDirection:'column' },
  sectionTitle: { margin:'0 0 20px', fontSize:18, fontWeight:700, color:'#fff', textShadow:'0 0 10px rgba(255,255,255,0.2)' },
  
  tabRow:   { display:'flex', gap:10, marginBottom:24, padding:'24px 24px 0' },
  tab:      { flex:1, padding:'14px 20px', border:'none', borderRadius:12, cursor:'pointer', fontSize:15, fontWeight:700, transition:'all 0.3s ease', boxShadow:'0 4px 15px rgba(0,0,0,0.2)' },

  complaintList:{ display:'flex', flexDirection:'column', gap:20, padding:'0 24px 24px' },
  emptyState:{ textAlign:'center', padding:'60px 20px' },
  emptyMsg: { color:'rgba(255,255,255,0.5)', fontSize:15, textAlign:'center', padding:'10px 0', marginBottom:16 },

  cCard:    { padding:0, display:'flex', flexDirection:'column', overflow:'hidden', transition:'transform 0.3s' },
  cTop:     { display:'flex', padding:20, gap:20 },
  cImg:     { width:140, height:100, objectFit:'cover', borderRadius:12, boxShadow:'0 4px 15px rgba(0,0,0,0.3)' },
  cBody:    { flex:1, display:'flex', flexDirection:'column', justifyContent:'center' },
  cBadges:  { display:'flex', gap:8, marginBottom:10 },
  cTitle:   { margin:'0 0 8px', fontSize:18, fontWeight:700, color:'#fff', cursor:'pointer' },
  cDesc:    { margin:0, fontSize:14, color:'rgba(255,255,255,0.6)', lineHeight:1.5 },
  
  cScoreBox:{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.3)', padding:'10px 20px', borderRadius:12, border:'1px solid rgba(255,255,255,0.05)', marginLeft:16 },
  ScoreTitle:{ fontSize:10, color:'rgba(255,255,255,0.5)', fontWeight:700, letterSpacing:1, marginBottom:4 },
  ScoreVal:  { fontSize:28, fontWeight:800, color:'var(--secondary)', textShadow:'0 0 15px var(--secondary-glow)', lineHeight:1 },

  cFooter:  { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', background:'rgba(0,0,0,0.2)', borderTop:'1px solid rgba(255,255,255,0.05)' },
  cMeta:    { margin:0, fontSize:13, color:'rgba(255,255,255,0.5)' },
  cActions: { display:'flex', gap:10, alignItems:'center' },
  voteRow:  { display:'flex', gap:8 },
  upBtn:    { background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.4)', color:'#34d399', padding:'6px 14px', borderRadius:20, cursor:'pointer', fontSize:13, fontWeight:600 },
  downBtn:  { background:'rgba(244,63,94,0.15)', border:'1px solid rgba(244,63,94,0.4)', color:'#fb7185', padding:'6px 14px', borderRadius:20, cursor:'pointer', fontSize:13, fontWeight:600 },

  scorerList:{ display:'flex', flexDirection:'column', gap:14 },
  scorerRow: { display:'flex', alignItems:'center', gap:14, padding:'12px', borderRadius:12, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' },
  rank:      { fontSize:24, minWidth:32, textAlign:'center', filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' },
  scorerInfo:{ flex:1 },
  scorerName:{ margin:0, fontSize:15, fontWeight:700, color:'#fff' },
  scorerLevel:{ margin:'2px 0 0', fontSize:12, fontWeight:600 },
  scorerPoints:{ fontSize:18, fontWeight:800 },

  deptGrid:  { display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10 },
  deptQuick: { display:'flex', alignItems:'center', gap:12, cursor:'pointer', borderRadius:12, padding:'12px', transition:'all 0.3s ease' },
};