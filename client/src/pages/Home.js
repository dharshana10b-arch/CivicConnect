import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();

    return (
        <div className="page-container" style={S.container}>
            {/* Navigation */}
            <nav style={S.nav}>
                <h1 style={S.logo}>🏙️ CivicConnect</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-secondary" onClick={() => navigate('/login')}>Login</button>
                    <button className="btn-primary" onClick={() => navigate('/register')}>Register</button>
                </div>
            </nav>

            {/* Glowing Hero Section */}
            <div style={S.hero}>
                <div style={S.glowOrb1}></div>
                <div style={S.glowOrb2}></div>
                <h1 style={S.heroTitle}>Smart Civic Governance</h1>
                <p style={S.heroSubtitle}>
                    Report local issues instantly, let AI analyze severity, and let your community drive the priority. 
                    Experience the future of civic engagement.
                </p>
                <div style={S.btnGroup}>
                    <button className="btn-primary" style={{ padding: '16px 48px', fontSize: '18px' }} onClick={() => navigate('/register')}>
                        Get Started →
                    </button>
                    <button className="btn-secondary" style={{ padding: '16px 48px', fontSize: '18px', background: 'transparent', border: 'none', textDecoration: 'underline' }} onClick={() => navigate('/feed')}>
                        View Live Feed
                    </button>
                </div>
            </div>

            {/* Glassmorphic Features Grid */}
            <div style={S.features}>
                {[
                    { icon: '🤖', title: 'AI Severity Analysis', desc: 'Upload an image and our AI instantly detects the severity of the issue, categorizing it for rapid response.' },
                    { icon: '🗳️', title: 'Community Voting', desc: 'Upvote or downvote complaints to ensure the most critical local problems are prioritized first.' },
                    { icon: '🏆', title: 'Gamified Impact', desc: 'Earn points and level up your civic avatar by reporting and validating community issues.' },
                    { icon: '🚀', title: 'Smart Admin Routing', desc: 'Complaints are automatically routed to the right government department dashboard with SLA tracking.' },
                ].map((f, i) => (
                    <div key={i} className="glass-card" style={S.featureCard}>
                        <div style={S.iconWrapper}>{f.icon}</div>
                        <h3 style={S.fTitle}>{f.title}</h3>
                        <p style={S.fDesc}>{f.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

const S = {
    container: {
        paddingBottom: '80px',
        position: 'relative',
        zIndex: 1,
    },
    nav: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 60px',
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
    },
    logo: {
        margin: 0,
        fontSize: '26px',
        fontWeight: '800',
        letterSpacing: '-1px',
        textShadow: '0 0 20px rgba(255,255,255,0.3)',
    },
    hero: {
        textAlign: 'center',
        padding: '120px 20px',
        position: 'relative',
        maxWidth: '900px',
        margin: '0 auto',
    },
    glowOrb1: {
        position: 'absolute',
        top: '10%', left: '15%',
        width: '300px', height: '300px',
        background: 'var(--primary)',
        filter: 'blur(100px)',
        opacity: 0.3,
        zIndex: -1,
        animation: 'pulse iber 4s infinite alternate',
    },
    glowOrb2: {
        position: 'absolute',
        top: '30%', right: '15%',
        width: '400px', height: '400px',
        background: 'var(--secondary)',
        filter: 'blur(120px)',
        opacity: 0.2,
        zIndex: -1,
    },
    heroTitle: {
        fontSize: '72px',
        fontWeight: '800',
        lineHeight: '1.1',
        marginBottom: '24px',
        background: 'linear-gradient(to right, #ffffff, #a5b4fc, #f472b6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0 10px 30px rgba(0,0,0,0.5)',
    },
    heroSubtitle: {
        fontSize: '22px',
        color: 'rgba(255,255,255,0.8)',
        maxWidth: '700px',
        margin: '0 auto 48px',
        lineHeight: '1.6',
        fontWeight: '300',
    },
    btnGroup: {
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        alignItems: 'center',
    },
    features: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '30px',
        padding: '40px 60px',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    featureCard: {
        padding: '40px 30px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    iconWrapper: {
        fontSize: '48px',
        marginBottom: '24px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)',
        width: '90px', height: '90px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '50%',
        boxShadow: 'inset 0 0 20px rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
    },
    fTitle: {
        fontSize: '22px',
        marginBottom: '16px',
        fontWeight: '700',
        color: '#fff',
    },
    fDesc: {
        fontSize: '15px',
        color: 'rgba(255,255,255,0.6)',
        lineHeight: '1.6',
    },
};

export default Home;