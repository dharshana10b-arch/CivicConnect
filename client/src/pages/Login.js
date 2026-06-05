import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login }    = useAuth();
    const navigate     = useNavigate();
    const [role,       setRole]    = useState('user');
    const [loading,    setLoading] = useState(false);
    const [formData,   setForm]    = useState({ email:'', password:'' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', {
                ...formData, role,
            });
            login(res.data.user, res.data.token);
            toast.success(`Welcome back, ${res.data.user.name}! 👋`);
            // Route based on role
            navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        }
        setLoading(false);
    };

    return (
        <div className="page-container" style={S.page}>
            <div className="glass-card" style={S.card}>
                {/* Logo */}
                <div style={S.logoWrap}>
                    <span style={S.logoIcon}>🏙️</span>
                    <h1 style={S.logoText}>CivicConnect</h1>
                    <p style={S.logoSub}>Smart City Issue Reporting</p>
                </div>

                {/* Highly Visible Role Toggle */}
                <div style={S.toggleWrap}>
                    {['user','admin'].map(r => {
                        const active = role === r;
                        return (
                            <button key={r} type="button" style={{
                                ...S.toggleBtn,
                                background: active ? (r==='admin' ? 'var(--secondary)' : 'var(--primary)') : 'transparent',
                                color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                                boxShadow: active ? `0 4px 15px ${r==='admin' ? 'var(--secondary-glow)' : 'var(--primary-glow)'}` : 'none',
                                transform: active ? 'scale(1.02)' : 'scale(1)',
                            }} onClick={() => setRole(r)}>
                                {r === 'user' ? '👤 Citizen Access' : '👮 Admin Portal'}
                            </button>
                        );
                    })}
                </div>

                <h2 style={{...S.title, color: role==='admin'?'var(--secondary)':'var(--primary)'}}>
                    {role === 'admin' ? 'Admin Authentication' : 'Welcome Back'}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div style={S.field}>
                        <label style={S.label}>Email Address</label>
                        <input className="sleek-input" type="email" placeholder="your@email.com"
                            value={formData.email}
                            onChange={e => setForm({...formData, email:e.target.value})}
                            required />
                    </div>
                    <div style={S.field}>
                        <label style={S.label}>Password</label>
                        <input className="sleek-input" type="password" placeholder="••••••••"
                            value={formData.password}
                            onChange={e => setForm({...formData, password:e.target.value})}
                            required />
                    </div>

                    {role === 'admin' && (
                        <div style={S.adminNote}>
                            ⚠️ <strong>Admin Notice:</strong> Accounts are provisioned exclusively by system administrators.
                        </div>
                    )}

                    <button className={role === 'admin' ? "btn-danger" : "btn-primary"} style={S.submitBtn} type="submit" disabled={loading}>
                        {loading ? 'Authenticating...' : role === 'admin' ? 'Secure Admin Login' : 'Login'}
                    </button>
                </form>

                <div style={S.footLinks}>
                    {role === 'user' && (
                        <p style={S.footText}>
                            New to CivicConnect? <Link to="/register" style={S.link}>Create an account</Link>
                        </p>
                    )}
                    <p style={S.footText}>
                        <Link to="/" style={S.linkBack}>← Return to Home</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

const S = {
    page:       { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
    card:       { padding: '48px 40px', width:'100%', maxWidth:440 },
    logoWrap:   { textAlign:'center', marginBottom:32 },
    logoIcon:   { fontSize:56, filter:'drop-shadow(0 0 10px rgba(255,255,255,0.2))' },
    logoText:   { margin:'12px 0 4px', color:'#fff', fontSize:28, fontWeight:800, letterSpacing:'-0.5px' },
    logoSub:    { margin:0, color:'rgba(255,255,255,0.6)', fontSize:14, fontWeight:400 },
    
    toggleWrap: { display:'flex', background:'rgba(0,0,0,0.3)', borderRadius:16, padding:6, marginBottom:32, border:'1px solid rgba(255,255,255,0.05)' },
    toggleBtn:  { flex:1, padding:'12px 0', border:'none', borderRadius:12, cursor:'pointer', fontSize:14, fontWeight:700, transition:'all 0.3s ease' },
    
    title:      { fontSize:20, fontWeight:700, marginBottom:24, textAlign:'center', letterSpacing:'0.5px' },
    field:      { marginBottom:20 },
    label:      { color:'rgba(255,255,255,0.8)', fontSize:13, display:'block', marginBottom:8, fontWeight:500 },
    
    adminNote:  { background:'rgba(233,69,96,0.15)', border:'1px solid var(--secondary)', borderRadius:12, padding:'12px 16px', color:'#fff', fontSize:13, marginBottom:20, lineHeight:1.5 },
    submitBtn:  { width:'100%', padding:'16px', fontSize:16, marginTop:8 },
    
    footLinks:  { marginTop:24, textAlign:'center' },
    footText:   { color:'rgba(255,255,255,0.6)', fontSize:14, margin:'10px 0' },
    link:       { color:'var(--primary)', textDecoration:'none', fontWeight:600 },
    linkBack:   { color:'rgba(255,255,255,0.8)', textDecoration:'none', fontWeight:500, borderBottom:'1px dashed rgba(255,255,255,0.4)' },
};
