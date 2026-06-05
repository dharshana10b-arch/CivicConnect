import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const DEPT_INFO = {
  Water:       { icon:'💧', color:'#3b82f6' },
  Electricity: { icon:'⚡', color:'#f59e0b' },
  Waste:       { icon:'🗑️', color:'#10b981' },
  Roads:       { icon:'🛣️', color:'#8b5cf6' },
  Sanitation:  { icon:'🧹', color:'#14b8a6' },
  Other:       { icon:'📋', color:'#64748b' },
};

const SEV_COLOR = { Low:'#34d399', Medium:'#fbbf24', High:'#f97316', Emergency:'#ef4444' };
const STA_COLOR = { Pending:'#f59e0b', 'In Progress':'#3b82f6', Resolved:'#10b981' };

export default function DepartmentDetail() {
  const { department } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints]   = useState({ pending:[], inProgress:[], resolved:[] });
  const [loading,    setLoading]      = useState(true);
  const [activeTab,  setActiveTab]    = useState('pending');
  const [filter,     setFilter]       = useState('All');

  const info = DEPT_INFO[department] || DEPT_INFO.Other;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchComplaints();
  }, [department]);

  const fetchComplaints = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/departments/${department}/complaints?locality=${encodeURIComponent(user.locality)}`,
        { headers: { Authorization:`Bearer ${token}` } }
      );
      setComplaints(res.data.grouped);
    } catch (_) { toast.error('Failed to load complaints'); }
    setLoading(false);
  };

  const handleVote = async (id, type) => {
    try {
      await axios.post(
        `http://localhost:5000/api/complaints/${id}/vote`,
        { voteType: type },
        { headers: { Authorization:`Bearer ${token}` } }
      );
      toast.success('Vote recorded!');
      fetchComplaints();
    } catch (_) { toast.error('Failed to vote'); }
  };

  const activeList = activeTab === 'pending'
    ? complaints.pending
    : activeTab === 'progress'
    ? complaints.inProgress
    : complaints.resolved;

  const filtered = filter === 'All' ? activeList
    : activeList.filter(c => c.severity === filter);

  const tabCount = {
    pending:  complaints.pending?.length  || 0,
    progress: complaints.inProgress?.length || 0,
    resolved: complaints.resolved?.length || 0,
  };

  return (
    <div className="page-container" style={S.page}>
      {/* Nav */}
      <div style={{ ...S.nav, borderBottom: `2px solid ${info.color}80` }}>
        <div style={S.navLeft}>
          <button className="btn-secondary" onClick={() => navigate('/departments')}>← Departments</button>
          <h1 style={S.logo}>{info.icon} {department} Department</h1>
        </div>
        <button
          className="btn-primary"
          style={{ background: `linear-gradient(135deg, ${info.color}, #ffffff50)` }}
          onClick={() => navigate(`/submit?department=${department}`)}
        >
          + Report New Issue
        </button>
      </div>

      {/* Stats bar */}
      <div className="glass-card" style={S.statsBar}>
        {[
          { label:'Pending',     count:tabCount.pending,  color:'#ef4444' },
          { label:'In Progress', count:tabCount.progress, color:'#3b82f6' },
          { label:'Resolved',    count:tabCount.resolved, color:'#10b981' },
          { label:'Total',       count:tabCount.pending+tabCount.progress+tabCount.resolved, color:'#94a3b8' },
        ].map((s,i) => (
          <div key={i} style={S.statBox}>
            <span style={{ ...S.statN, color:s.color, textShadow:`0 0 10px ${s.color}60` }}>{s.count}</span>
            <span style={S.statL}>{s.label}</span>
          </div>
        ))}
        <div style={S.localityTag}>📍 {user?.locality}</div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {[
          { key:'pending',  label:`🔴 Pending (${tabCount.pending})` },
          { key:'progress', label:`🔧 In Progress (${tabCount.progress})` },
          { key:'resolved', label:`✅ Resolved (${tabCount.resolved})` },
        ].map(tab => (
          <button
            key={tab.key}
            style={{ ...S.tab, ...(activeTab===tab.key ? { ...S.tabActive, borderColor:info.color, color:'#fff' } : {}) }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Severity filter */}
      <div style={S.filterRow}>
        {['All','Low','Medium','High','Emergency'].map(f => (
          <button
            key={f}
            className="shiny-badge"
            style={{
              ...S.filterBtn,
              background: filter===f ? info.color : 'rgba(255,255,255,0.05)',
              color: filter===f ? '#fff' : 'rgba(255,255,255,0.6)',
              borderColor: filter===f ? info.color : 'rgba(255,255,255,0.1)'
            }}
            onClick={() => setFilter(f)}
          >{f}</button>
        ))}
      </div>

      {/* Complaints list */}
      <div style={S.content}>
        {loading ? (
          <div style={S.empty}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={S.emptyState}>
            <div style={S.emptyIcon}>
              {activeTab==='pending'?'🎉':activeTab==='progress'?'📋':'📭'}
            </div>
            <p style={S.emptyText}>
              {activeTab==='pending'
                ? 'No pending issues! Great work community 🎉'
                : activeTab==='progress'
                ? 'No issues currently in progress'
                : 'No resolved issues yet'}
            </p>
            <button className="btn-primary" style={{ background: info.color }}
              onClick={() => navigate(`/submit?department=${department}`)}>
              + Report an Issue
            </button>
          </div>
        ) : (
          <div style={S.list}>
            {filtered.map(c => (
              <div key={c._id} className="glass-card" style={S.card}>
                <img src={c.image} alt="complaint" style={S.img}/>
                <div style={S.cardBody}>
                  <div style={S.cardTop}>
                    <div style={S.userRow}>
                      <span style={S.avatar}>{c.user?.avatar || '👤'}</span>
                      <div>
                        <p style={S.userName}>{c.user?.name}</p>
                        <p style={S.userLoc}>📍 {c.locality}</p>
                      </div>
                    </div>
                    <div style={S.badges}>
                      <span className="shiny-badge" style={{ color:SEV_COLOR[c.severity], borderColor:SEV_COLOR[c.severity] }}>{c.severity}</span>
                      <span className="shiny-badge" style={{ color:STA_COLOR[c.status], borderColor:STA_COLOR[c.status] }}>{c.status}</span>
                    </div>
                  </div>

                  <h3 style={S.cardTitle}
                    onClick={() => navigate(`/complaint/${c._id}`)}>
                    {c.title}
                  </h3>
                  <p style={S.cardDesc}>{c.description?.substring(0, 100)}...</p>

                  <div style={S.cardFooter}>
                    <span style={S.priority}>⚡ Priority: {c.priorityScore}</span>
                    <span style={S.date}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>

                  <div style={S.voteRow}>
                    <button style={S.upBtn} onClick={() => handleVote(c._id,'upvote')}>
                      👍 {c.upvotes?.length || 0}
                    </button>
                    <button style={S.downBtn} onClick={() => handleVote(c._id,'downvote')}>
                      👎 {c.downvotes?.length || 0}
                    </button>
                    <button className="btn-secondary" style={{ marginLeft:'auto' }}
                      onClick={() => navigate(`/complaint/${c._id}`)}>
                      View Progress →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  page:     { paddingBottom:'80px' },
  nav:      { padding:'24px 40px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.02)', backdropFilter:'blur(20px)' },
  navLeft:  { display:'flex', alignItems:'center', gap:20 },
  logo:     { margin:0, color:'#fff', fontSize:26, textShadow:'0 0 15px rgba(255,255,255,0.2)' },

  statsBar: { margin:'24px 40px', padding:'24px 32px', display:'flex', gap:32, alignItems:'center', flexWrap:'wrap' },
  statBox:  { display:'flex', flexDirection:'column', alignItems:'center', gap:4 },
  statN:    { fontSize:32, fontWeight:800 },
  statL:    { fontSize:12, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:1 },
  localityTag:{ marginLeft:'auto', background:'rgba(255,255,255,0.05)', padding:'8px 16px', borderRadius:20, fontSize:14, color:'#fff', border:'1px solid rgba(255,255,255,0.1)' },

  tabs:     { display:'flex', padding:'0 40px', borderBottom:'1px solid rgba(255,255,255,0.05)', marginBottom:'20px' },
  tab:      { padding:'16px 24px', background:'transparent', border:'none', cursor:'pointer', fontSize:15, color:'rgba(255,255,255,0.5)', fontWeight:600, borderBottom:'3px solid transparent', transition:'all 0.3s' },
  tabActive:{ color:'#fff' },

  filterRow:{ display:'flex', gap:10, padding:'0 40px 24px', flexWrap:'wrap' },
  filterBtn:{ cursor:'pointer', fontSize:13 },

  content:  { padding:'0 40px 48px', maxWidth:1200, margin:'0 auto' },
  empty:    { textAlign:'center', padding:'60px', color:'rgba(255,255,255,0.5)' },
  emptyState:{ textAlign:'center', padding:'60px 20px', maxWidth:'600px', margin:'40px auto' },
  emptyIcon:{ fontSize:72, marginBottom:20 },
  emptyText:{ color:'rgba(255,255,255,0.7)', fontSize:18, marginBottom:24 },

  list:     { display:'flex', flexDirection:'column', gap:24 },
  card:     { padding:0, display:'flex', overflow:'hidden', transition:'transform 0.3s, box-shadow 0.3s' },
  img:      { width:260, objectFit:'cover', flexShrink:0, borderRight:'1px solid rgba(255,255,255,0.05)' },
  cardBody: { padding:24, flex:1, display:'flex', flexDirection:'column', gap:12 },
  cardTop:  { display:'flex', justifyContent:'space-between', alignItems:'flex-start' },
  userRow:  { display:'flex', alignItems:'center', gap:12 },
  avatar:   { fontSize:28 },
  userName: { margin:0, fontWeight:700, fontSize:15, color:'#fff' },
  userLoc:  { margin:0, fontSize:13, color:'rgba(255,255,255,0.6)' },
  badges:   { display:'flex', gap:8 },
  cardTitle:{ margin:0, fontSize:20, fontWeight:700, color:'#fff', cursor:'pointer' },
  cardDesc: { margin:0, color:'rgba(255,255,255,0.7)', fontSize:15, lineHeight:1.5 },
  cardFooter:{ display:'flex', justifyContent:'space-between', fontSize:13, color:'rgba(255,255,255,0.5)', marginTop:'auto', paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.05)' },
  priority: { color:'var(--secondary)', fontWeight:700 },
  voteRow:  { display:'flex', gap:12, alignItems:'center', paddingTop:12 },
  upBtn:    { background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.4)', color:'#34d399', padding:'8px 16px', borderRadius:20, cursor:'pointer', fontSize:14, fontWeight:600 },
  downBtn:  { background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.4)', color:'#f87171', padding:'8px 16px', borderRadius:20, cursor:'pointer', fontSize:14, fontWeight:600 },
};