import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const SEV_COLOR = { Low:'#34d399', Medium:'#fbbf24', High:'#f97316', Emergency:'#ef4444' };
const STA_COLOR = { Pending:'#fbbf24', 'In Progress':'#3b82f6', Resolved:'#10b981' };
const DEPT_ICON = { Water:'💧', Electricity:'⚡', Waste:'🗑️', Roads:'🛣️', Sanitation:'🧹', Other:'📋' };

// Utility to create consistent pseudo-random coordinates around a central point based on complaint ID
// Uses Chennai coordinates as base (13.0827, 80.2707)
const generateMockCoords = (strId) => {
    let hash = 0;
    if (strId) {
        for (let i = 0; i < strId.length; i++) {
            hash = strId.charCodeAt(i) + ((hash << 5) - hash);
        }
    }
    const latOffset = ((Math.abs(hash) % 100) / 1000) - 0.05;
    const lngOffset = ((Math.abs(hash * 3) % 100) / 1000) - 0.05;
    return [13.0827 + latOffset, 80.2707 + lngOffset];
};

export default function AdminDashboard() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    const [page,         setPage]        = useState('complaints'); // complaints | heatmap | analytics
    const [complaints,   setComplaints]  = useState([]);
    const [stats,        setStats]       = useState({});
    const [slaBreach,    setSlaBreach]   = useState(0);
    const [alerts,       setAlerts]      = useState([]);
    const [analytics,    setAnalytics]   = useState(null);
    const [loading,      setLoading]     = useState(true);
    const [notifications,setNotifs]      = useState([]);
    const [showNotifs,   setShowNotifs]  = useState(false);
    const [selected,     setSelected]    = useState([]);
    const [filters,      setFilters]     = useState({ status:'All', department:'All', severity:'All', sort:'newest' });
    const socketRef = useRef(null);

    const headers = { Authorization: `Bearer ${token}` };
    const area    = user?.assignedArea || user?.locality || '';

    useEffect(() => {
        if (!user || user.role !== 'admin') { navigate('/login'); return; }
        fetchComplaints();
        fetchHeatmapData();
        fetchAnalytics();
        setupSocket();
        return () => socketRef.current?.disconnect();
    }, []);

    useEffect(() => { fetchComplaints(); }, [filters]);

    const setupSocket = () => {
        const socket = io('http://localhost:5000');
        socketRef.current = socket;
        socket.emit('joinAdminRoom', area);
        socket.on('newComplaint', (data) => {
            setNotifs(prev => [{ ...data, id: Date.now(), read: false }, ...prev].slice(0,20));
            toast.info(`🆕 New ${data.complaint.severity} complaint: "${data.complaint.title}"`);
            fetchComplaints();
        });
    };

    const fetchComplaints = async () => {
        try {
            const params = new URLSearchParams(filters).toString();
            const res    = await axios.get(`http://localhost:5000/api/admin/complaints?${params}`, { headers });
            setComplaints(res.data.complaints || []);
            setStats(res.data.stats || {});
            setSlaBreach(res.data.slaBreach || 0);
        } catch (_) { toast.error('Failed to load complaints'); }
        setLoading(false);
    };

    const fetchHeatmapData = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/heatmap', { headers });
            setAlerts(res.data.alerts || []);
        } catch (_) {}
    };

    const fetchAnalytics = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/analytics', { headers });
            setAnalytics(res.data);
        } catch (_) {}
    };

    const updateStatus = async (id, status) => {
        try {
            await axios.put(`http://localhost:5000/api/admin/complaints/${id}`, { status }, { headers });
            toast.success(`✅ Marked as ${status}`);
            fetchComplaints();
        } catch (_) { toast.error('Update failed'); }
    };

    const bulkUpdate = async (status) => {
        if (!selected.length) { toast.warn('Select complaints first'); return; }
        try {
            await axios.post('http://localhost:5000/api/admin/complaints/bulk', { ids: selected, status }, { headers });
            toast.success(`${selected.length} complaints updated`);
            setSelected([]);
            fetchComplaints();
        } catch (_) { toast.error('Bulk update failed'); }
    };

    const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);
    const selectAll    = () => setSelected(selected.length === complaints.length ? [] : complaints.map(c=>c._id));

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="page-container" style={S.page}>
            {/* ── NAV ── */}
            <div style={S.nav}>
                <div style={S.navLeft}>
                    <span style={S.navLogo}>🏙️ CivicConnect</span>
                    <span className="shiny-badge" style={S.adminBadge}>👮 ADMIN</span>
                    <span className="shiny-badge" style={S.areaBadge}>📍 {area}</span>
                </div>
                <div style={S.navCenter}>
                    {[
                        { key:'complaints', label:'📋 Complaints' },
                        { key:'heatmap',    label:'🌍 Geographical Map' },
                        { key:'analytics',  label:'📊 Analytics'  },
                    ].map(p => (
                        <button key={p.key} style={{
                            ...S.navTab,
                            background: page===p.key ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            color: page===p.key ? '#fff' : 'rgba(255,255,255,0.7)',
                            borderColor: page===p.key ? 'var(--primary)' : 'transparent',
                        }} onClick={() => setPage(p.key)}>{p.label}</button>
                    ))}
                </div>
                <div style={S.navRight}>
                    {/* Notification bell */}
                    <button style={S.bellBtn} onClick={() => { setShowNotifs(s=>!s); setNotifs(p=>p.map(n=>({...n,read:true}))); }}>
                        🔔 {unreadCount > 0 && <span style={S.badge}>{unreadCount}</span>}
                    </button>
                    <span style={S.adminName}>{user?.name}</span>
                    <button className="btn-secondary" style={S.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>Logout</button>
                </div>
            </div>

            {/* Notification dropdown */}
            {showNotifs && (
                <div className="glass-card" style={S.notifDropdown}>
                    <p style={S.notifTitle}>🔔 Recent Notifications</p>
                    {notifications.length === 0 ? (
                        <p style={S.notifEmpty}>No notifications yet</p>
                    ) : notifications.map(n => (
                        <div key={n.id} style={S.notifItem} onClick={() => setPage('complaints')}>
                            <span className="shiny-badge" style={{ color: SEV_COLOR[n.complaint?.severity] || '#999', borderColor: SEV_COLOR[n.complaint?.severity] || '#999' }}>
                                {n.complaint?.severity}
                            </span>
                            <div>
                                <p style={S.notifMsg}>{n.complaint?.title}</p>
                                <p style={S.notifSub}>{n.complaint?.department} · {n.complaint?.locality}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── STATS BAR ── */}
            <div className="glass-card" style={S.statsBar}>
                {[
                    { label:'Total',       val: stats.total      || 0, color:'#60a5fa' },
                    { label:'Pending',     val: stats.pending    || 0, color:'#fbbf24' },
                    { label:'In Progress', val: stats.inProgress || 0, color:'#3b82f6' },
                    { label:'Resolved',    val: stats.resolved   || 0, color:'#34d399' },
                    { label:'Emergency',   val: stats.emergency  || 0, color:'#ef4444' },
                    { label:'SLA Breach',  val: slaBreach,              color:'#f87171' },
                ].map((s,i) => (
                    <div key={i} style={S.statCard}>
                        <span style={{ ...S.statN, color:s.color, textShadow: `0 0 10px ${s.color}60` }}>{s.val}</span>
                        <span style={S.statL}>{s.label}</span>
                        {s.label === 'SLA Breach' && s.val > 0 && (
                            <span style={S.slaWarn}>⚠️ &gt;48h</span>
                        )}
                    </div>
                ))}
            </div>

            {/* ── COMPLAINTS PAGE ── */}
            {page === 'complaints' && (
                <div style={S.content}>
                    {/* Filters */}
                    <div className="glass-card" style={S.filterRow}>
                        {[
                            { key:'status',     opts:['All','Pending','In Progress','Resolved'] },
                            { key:'department', opts:['All','Water','Electricity','Waste','Roads','Sanitation','Other'] },
                            { key:'severity',   opts:['All','Low','Medium','High','Emergency'] },
                            { key:'sort',       opts:['newest','oldest','priority'] },
                        ].map(f => (
                            <select key={f.key} style={S.filterSelect}
                                value={filters[f.key]}
                                onChange={e => setFilters(p=>({...p,[f.key]:e.target.value}))}>
                                {f.opts.map(o => <option value={o} key={o}>{f.key}: {o}</option>)}
                            </select>
                        ))}
                        {selected.length > 0 && (
                            <div style={S.bulkActions}>
                                <span style={S.bulkCount}>{selected.length} selected</span>
                                <button className="btn-primary" onClick={() => bulkUpdate('In Progress')}>→ In Progress</button>
                                <button className="btn-primary" style={{ background:'#10b981' }} onClick={() => bulkUpdate('Resolved')}>✅ Resolve All</button>
                            </div>
                        )}
                    </div>

                    {/* Complaints list */}
                    {loading ? <div style={S.loading}>Loading complaints...</div> : (
                        <>
                            <div style={S.listHeader}>
                                <input type="checkbox" checked={selected.length===complaints.length && complaints.length>0}
                                    onChange={selectAll} style={{ marginRight:8 }} className="custom-checkbox" />
                                <span style={{ color:'rgba(255,255,255,0.7)', fontSize:14 }}>{complaints.length} complaints in {area}</span>
                            </div>
                            <div style={S.list}>
                                {complaints.length === 0 ? (
                                    <div className="glass-card" style={S.empty}>
                                        <p style={{ fontSize:48, margin:0 }}>🎉</p>
                                        <p style={{ color: 'rgba(255,255,255,0.7)' }}>No complaints matching these filters!</p>
                                    </div>
                                ) : complaints.map(c => (
                                    <div key={c._id} className="glass-card" style={{
                                        ...S.card,
                                        borderLeft: `4px solid ${SEV_COLOR[c.severity] || 'rgba(255,255,255,0.2)'}`,
                                        opacity: c.status === 'Resolved' ? 0.6 : 1,
                                    }}>
                                        <div style={S.cardTop}>
                                            <input type="checkbox" checked={selected.includes(c._id)}
                                                onChange={() => toggleSelect(c._id)} style={{ marginRight:16, marginTop:8 }}/>
                                            <img src={c.image} alt="" style={S.thumb}/>
                                            <div style={{ flex:1 }}>
                                                <div style={S.cardBadges}>
                                                    <span className="shiny-badge" style={{ color:SEV_COLOR[c.severity], borderColor:SEV_COLOR[c.severity] }}>{c.severity}</span>
                                                    <span className="shiny-badge" style={{ color:STA_COLOR[c.status], borderColor:STA_COLOR[c.status] }}>{c.status}</span>
                                                    <span className="shiny-badge" style={{ color:'#94a3b8', borderColor:'#94a3b8' }}>{DEPT_ICON[c.department]} {c.department}</span>
                                                    {(Date.now()-new Date(c.createdAt).getTime()) > 48*60*60*1000 && c.status==='Pending' && (
                                                        <span className="shiny-badge" style={{ color:'#ef4444', borderColor:'#ef4444', animation: 'pulse 2s infinite' }}>⚠️ SLA Breach</span>
                                                    )}
                                                </div>
                                                <h3 style={S.cardTitle} onClick={() => navigate(`/complaint/${c._id}`)}>{c.title}</h3>
                                                <p style={S.cardMeta}>
                                                    📍 {c.locality} · 👤 {c.user?.name} ·
                                                    ⚡ Priority: {c.priorityScore} ·
                                                    🕒 {new Date(c.createdAt).toLocaleDateString('en-IN')}
                                                </p>
                                                <p style={S.cardDesc}>{c.description?.substring(0,180)}...</p>
                                            </div>
                                        </div>
                                        {/* Status actions */}
                                        <div style={S.cardActions}>
                                            {['Pending','In Progress','Resolved'].map(s => (
                                                <button key={s}
                                                    style={{
                                                        ...S.statusBtn,
                                                        background: c.status===s ? 'rgba(255,255,255,0.1)' : 'transparent',
                                                        color:      c.status===s ? '#fff' : 'rgba(255,255,255,0.4)',
                                                        border:     `1px solid ${c.status===s ? STA_COLOR[s] : 'rgba(255,255,255,0.1)'}`
                                                    }}
                                                    onClick={() => c.status!==s && updateStatus(c._id, s)}>
                                                    <span style={{color: STA_COLOR[s]}}>{s==='Pending'?'🔴':s==='In Progress'?'🔧':'✅'}</span> {s}
                                                </button>
                                            ))}
                                            <button className="btn-secondary" style={S.viewBtn} onClick={() => navigate(`/complaint/${c._id}`)}>
                                                View →
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── HEATMAP PAGE (GEOGRAPHICAL MAP) ── */}
            {page === 'heatmap' && (
                <div style={S.content}>
                    {/* Predictive alerts */}
                    {alerts.length > 0 && (
                        <div className="glass-card" style={S.alertBox}>
                            <h3 style={S.alertTitle}>🤖 AI Predictive Alerts</h3>
                            {alerts.map((a,i) => (
                                <div key={i} style={{ ...S.alert, borderLeft:`4px solid ${SEV_COLOR[a.severity]}` }}>
                                    <span className="shiny-badge" style={{ color:SEV_COLOR[a.severity], borderColor:SEV_COLOR[a.severity] }}>{a.severity}</span>
                                    <p style={S.alertMsg}>{a.message}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <h3 style={S.sectionTitle}>🗺️ Live Issue Geographical Map — {area || "Region"}</h3>
                    <p style={{ color:'rgba(255,255,255,0.6)', marginBottom:'20px' }}>Higher priority areas correspond to larger, red indicators. Hover over a marker to see complaint details.</p>
                    
                    <div className="glass-card" style={S.mapWrapper}>
                        <MapContainer center={[13.0827, 80.2707]} zoom={12} style={{ height: '600px', width: '100%', borderRadius: '16px', zIndex: 0 }}>
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />
                            {complaints.filter(c => c.status !== 'Resolved').map(c => {
                                const coords = generateMockCoords(c._id);
                                const color = SEV_COLOR[c.severity] || '#3b82f6';
                                const radius = c.priorityScore ? Math.max(8, c.priorityScore / 1.5) : 12;
                                return (
                                    <CircleMarker 
                                        key={c._id} 
                                        center={coords} 
                                        radius={radius} 
                                        pathOptions={{ color, fillColor: color, fillOpacity: 0.5, weight: 2 }}
                                    >
                                        <LeafletTooltip direction="top" offset={[0, -10]} opacity={1}>
                                            <div style={{ color: '#0f3460', maxWidth: '250px', padding: '4px' }}>
                                                <h4 style={{ margin: '0 0 4px', fontWeight: 'bold', fontSize: '14px' }}>{c.title}</h4>
                                                <p style={{ margin: '0 0 4px', fontSize: '12px' }}>{DEPT_ICON[c.department]} {c.department} | 📍 {c.locality}</p>
                                                <p style={{ margin: '0', fontSize: '12px', color: color, fontWeight: 'bold' }}>{c.severity} Severity</p>
                                            </div>
                                        </LeafletTooltip>
                                    </CircleMarker>
                                );
                            })}
                        </MapContainer>
                    </div>

                    {/* Legend */}
                    <div className="glass-card" style={S.legend}>
                        <span style={{ color:'rgba(255,255,255,0.8)', fontWeight:'bold' }}>Map Guide:</span>
                        {['Low Priority (Green)','Medium Priority (Yellow)','High Priority (Orange)','Emergency (Red)'].map((l,i)=>(
                            <span key={i} style={{ ...S.legendItem, border:`1px solid ${['#34d399','#fbbf24','#f97316','#ef4444'][i]}` }}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: ['#34d399','#fbbf24','#f97316','#ef4444'][i], display: 'inline-block', marginRight: 6 }}></span>
                                {l}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* ── ANALYTICS PAGE ── */}
            {page === 'analytics' && analytics && (
                <div style={S.content}>
                    {/* Summary cards */}
                    <div style={S.analyticsGrid}>
                        {[
                            { label:'Total Filed',       val:analytics.totalFiled,           icon:'📋', color:'#60a5fa' },
                            { label:'Total Resolved',    val:analytics.totalResolved,         icon:'✅', color:'#34d399' },
                            { label:'Resolution Rate',   val:`${analytics.resolutionRate}%`,  icon:'📈', color:'#c084fc' },
                            { label:'Avg Resolution',    val:`${analytics.avgResolutionHours}h`,icon:'⏱️',color:'#fbbf24' },
                        ].map((s,i)=>(
                            <div key={i} className="glass-card" style={S.analyticsCard}>
                                <span style={S.analyticsIcon}>{s.icon}</span>
                                <span style={{ ...S.analyticsN, color:s.color, textShadow: `0 0 10px ${s.color}60` }}>{s.val}</span>
                                <span style={S.analyticsL}>{s.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Daily chart (CSS bars) */}
                    <div className="glass-card" style={S.chartSection}>
                        <h3 style={S.sectionTitle}>📅 Last 7 Days Activity</h3>
                        <div style={S.chart}>
                            {Object.entries(analytics.daily).map(([day, data], i) => {
                                const max  = Math.max(...Object.values(analytics.daily).map(d=>d.filed), 1);
                                const h    = Math.max((data.filed / max) * 120, 4);
                                const hr   = Math.max((data.resolved / max) * 120, 4);
                                return (
                                    <div key={i} style={S.chartCol}>
                                        <div style={S.bars}>
                                            <div style={{ ...S.bar, height:h, background:'var(--primary)' }} title={`Filed: ${data.filed}`}/>
                                            <div style={{ ...S.bar, height:hr,background:'#34d399' }} title={`Resolved: ${data.resolved}`}/>
                                        </div>
                                        <span style={S.dayLabel}>{day}</span>
                                        <span style={S.dayVal}>{data.filed}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={S.chartLegend}>
                            <span style={S.clItem}><span style={{ ...S.clDot, background:'var(--primary)' }}/> Filed</span>
                            <span style={S.clItem}><span style={{ ...S.clDot, background:'#34d399' }}/> Resolved</span>
                        </div>
                    </div>

                    {/* Top reporters */}
                    <div className="glass-card" style={{ padding: '30px', marginTop: '30px' }}>
                        <h3 style={S.sectionTitle}>🏆 Top Reporters in {area}</h3>
                        {(analytics.topReporters||[]).map((u,i)=>(
                            <div key={u._id} style={S.reporterRow}>
                                <span style={S.reporterRank}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</span>
                                <span style={S.reporterAvatar}>{u.avatar}</span>
                                <div style={{ flex:1 }}>
                                    <p style={S.reporterName}>{u.name}</p>
                                    <p style={S.reporterLevel}>{u.avatarLevel}</p>
                                </div>
                                <span style={S.reporterPts}>{u.points} pts</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

const S = {
    page:       { paddingBottom:'80px' },
    nav:        { background:'rgba(255,255,255,0.02)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'16px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:20 },
    navLeft:    { display:'flex', alignItems:'center', gap:16 },
    navCenter:  { display:'flex', gap:8 },
    navRight:   { display:'flex', alignItems:'center', gap:16 },
    navLogo:    { color:'#fff', fontWeight:800, fontSize:22, textShadow:'0 0 15px rgba(255,255,255,0.2)' },
    adminBadge: { color:'#ef4444', borderColor:'#ef4444' },
    areaBadge:  { color:'#60a5fa', borderColor:'#60a5fa' },
    navTab:     { border:'1px solid', padding:'8px 20px', borderRadius:'20px', cursor:'pointer', fontSize:14, transition:'all 0.3s', fontWeight: 600 },
    adminName:  { color:'rgba(255,255,255,0.9)', fontSize:14, fontWeight:600 },
    logoutBtn:  { padding:'6px 16px', fontSize:13 },
    bellBtn:    { position:'relative', background:'rgba(255,255,255,0.05)', color:'#fff', border:'1px solid rgba(255,255,255,0.1)', padding:'10px', borderRadius:'50%', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' },
    badge:      { position:'absolute', top:-4, right:-4, background:'#ef4444', color:'#fff', borderRadius:'50%', width:20, height:20, fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, border:'2px solid #0f3460' },

    notifDropdown:{ position:'absolute', top:80, right:40, width:380, zIndex:9000, padding: 0 },
    notifTitle:   { margin:0, padding:'16px 20px', fontWeight:700, fontSize:15, color:'#fff', borderBottom:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.2)' },
    notifEmpty:   { padding:'30px', textAlign:'center', color:'rgba(255,255,255,0.5)', fontSize:14 },
    notifItem:    { padding:'16px 20px', display:'flex', gap:16, alignItems:'flex-start', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.05)', transition:'background 0.2s' },
    notifSev:     { flexShrink:0 },
    notifMsg:     { margin:'0 0 4px', fontSize:14, fontWeight:600, color:'#fff' },
    notifSub:     { margin:0, fontSize:12, color:'rgba(255,255,255,0.6)' },

    statsBar:   { display:'flex', gap:16, margin:'24px 40px', padding:'20px 32px', flexWrap:'wrap' },
    statCard:   { flex:1, minWidth:120, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:16, padding:'16px', display:'flex', flexDirection:'column', alignItems:'center', gap:4, position:'relative' },
    statN:      { fontSize:32, fontWeight:800 },
    statL:      { fontSize:12, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:1 },
    slaWarn:    { position:'absolute', top:12, right:12, fontSize:11, color:'#ef4444', fontWeight:700, background:'rgba(239, 68, 68, 0.15)', padding:'4px 8px', borderRadius:'12px' },

    content:    { padding:'0 40px 40px', maxWidth:1400, margin:'0 auto' },
    filterRow:  { display:'flex', gap:12, marginBottom:24, flexWrap:'wrap', alignItems:'center', padding:'16px 24px' },
    filterSelect:{ padding:'10px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', fontSize:14, background:'rgba(0,0,0,0.3)', color:'#fff', cursor:'pointer', appearance:'none' },
    bulkActions:{ display:'flex', gap:12, alignItems:'center', marginLeft:'auto' },
    bulkCount:  { fontSize:14, color:'rgba(255,255,255,0.8)', fontWeight:600 },

    listHeader: { display:'flex', alignItems:'center', padding:'0 8px 16px' },
    list:       { display:'flex', flexDirection:'column', gap:16 },
    loading:    { textAlign:'center', padding:80, color:'rgba(255,255,255,0.5)', fontSize:18 },
    empty:      { textAlign:'center', padding:'80px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:16 },

    card:       { padding:24, display:'flex', flexDirection:'column', gap:16 },
    cardTop:    { display:'flex', alignItems:'flex-start', gap:16 },
    thumb:      { width:120, height:90, objectFit:'cover', borderRadius:12, flexShrink:0, border:'1px solid rgba(255,255,255,0.1)' },
    cardBadges: { display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 },
    cardTitle:  { margin:'0 0 8px', fontSize:18, fontWeight:700, color:'#fff', cursor:'pointer' },
    cardMeta:   { margin:'0 0 12px', fontSize:13, color:'rgba(255,255,255,0.6)' },
    cardDesc:   { margin:0, fontSize:14, color:'rgba(255,255,255,0.8)', lineHeight:1.6 },
    cardActions:{ display:'flex', gap:12, flexWrap:'wrap', paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.05)' },
    statusBtn:  { padding:'8px 16px', borderRadius:20, cursor:'pointer', fontSize:13, fontWeight:600, transition:'all 0.2s' },
    viewBtn:    { marginLeft:'auto', padding:'8px 24px', fontSize:13 },

    alertBox:   { padding:24, marginBottom:24 },
    alertTitle: { margin:'0 0 16px', color:'#fff', fontSize:20, fontWeight:700 },
    alert:      { padding:'16px 20px', borderRadius:12, background:'rgba(0,0,0,0.2)', marginBottom:12, display:'flex', gap:16, alignItems:'center' },
    alertMsg:   { margin:0, fontSize:15, color:'rgba(255,255,255,0.9)' },
    sectionTitle:{ color:'#fff', fontSize:24, fontWeight:800, margin:'0 0 8px', textShadow:'0 0 20px rgba(255,255,255,0.2)' },
    
    mapWrapper: { padding: '4px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', overflow: 'hidden' },
    
    legend:     { display:'flex', gap:16, alignItems:'center', flexWrap:'wrap', fontSize:14, margin:'24px 0', padding:'20px 24px' },
    legendItem: { padding:'6px 16px', borderRadius:20, fontSize:13, color:'rgba(255,255,255,0.8)', background:'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center' },

    analyticsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:20, marginBottom:32 },
    analyticsCard: { padding:24, textAlign:'center', display:'flex', flexDirection:'column', gap:8, alignItems:'center' },
    analyticsIcon: { fontSize:40, marginBottom:4 },
    analyticsN:    { fontSize:36, fontWeight:800 },
    analyticsL:    { fontSize:13, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:1 },

    chartSection:{ padding:30, marginBottom:32 },
    chart:      { display:'flex', gap:12, alignItems:'flex-end', height:200, padding:'20px 0 10px', borderBottom:'1px solid rgba(255,255,255,0.05)' },
    chartCol:   { display:'flex', flexDirection:'column', alignItems:'center', gap:8, flex:1 },
    bars:       { display:'flex', gap:4, alignItems:'flex-end' },
    bar:        { width:20, borderRadius:'6px 6px 0 0', transition:'height 0.5s ease', minHeight:4 },
    dayLabel:   { fontSize:12, color:'rgba(255,255,255,0.6)', textAlign:'center' },
    dayVal:     { fontSize:13, color:'#fff', fontWeight:700 },
    chartLegend:{ display:'flex', gap:24, marginTop:24, justifyContent:'center' },
    clItem:     { display:'flex', alignItems:'center', gap:8, fontSize:14, color:'rgba(255,255,255,0.8)', fontWeight:600 },
    clDot:      { width:12, height:12, borderRadius:'50%', display:'inline-block' },

    reporterRow:  { display:'flex', alignItems:'center', gap:16, padding:'16px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' },
    reporterRank: { fontSize:24, minWidth:40, textAlign:'center' },
    reporterAvatar:{ fontSize:32 },
    reporterName: { margin:'0 0 4px', fontWeight:700, fontSize:16, color:'#fff' },
    reporterLevel:{ margin:0, fontSize:13, color:'rgba(255,255,255,0.6)' },
    reporterPts:  { fontWeight:800, color:'var(--secondary)', fontSize:20, textShadow:'0 0 10px var(--secondary-glow)' },
};