import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

function ComplaintProgress() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComplaint();
    }, []);

    const fetchComplaint = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/complaints/${id}`);
            setComplaint(res.data.complaint);
        } catch (error) {
            toast.error('Failed to fetch complaint');
        }
        setLoading(false);
    };

    const getStatusStep = (status) => {
        const steps = ['Pending', 'In Progress', 'Resolved'];
        return steps.indexOf(status);
    };

    const getSeverityColor = (severity) => {
        const colors = {
            Low: '#34d399',
            Medium: '#fbbf24',
            High: '#f97316',
            Emergency: '#ef4444'
        };
        return colors[severity] || '#34d399';
    };

    if (loading) return <p style={styles.loading}>Loading smart city data...</p>;
    if (!complaint) return <p style={styles.loading}>Complaint not found</p>;

    const currentStep = getStatusStep(complaint.status);

    return (
        <div className="page-container" style={styles.container}>
            <nav style={styles.nav}>
                <h1 style={styles.logo}>🏙️ CivicConnect</h1>
                <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                    ← Back to Dashboard
                </button>
            </nav>

            <div style={styles.content}>
                <div className="glass-card" style={styles.card}>
                    <img src={complaint.image} alt="complaint" style={styles.image} />

                    <div style={styles.info}>
                        <h2 style={styles.title}>{complaint.title}</h2>
                        <p style={styles.description}>{complaint.description}</p>

                        <div style={styles.tags}>
                            <span className="shiny-badge" style={{
                                ...styles.tag,
                                borderColor: getSeverityColor(complaint.severity),
                                color: getSeverityColor(complaint.severity)
                            }}>
                                🔥 {complaint.severity} Severity
                            </span>
                            <span className="shiny-badge" style={{ ...styles.tag, color: '#60a5fa', borderColor: '#60a5fa' }}>
                                🏢 {complaint.department}
                            </span>
                            <span className="shiny-badge" style={{ ...styles.tag, color: '#cbd5e1', borderColor: '#cbd5e1' }}>
                                📍 {complaint.locality}
                            </span>
                        </div>

                        {/* Priority Score */}
                        <div style={styles.priorityBox}>
                            <h3 style={styles.priorityTitle}>Priority Score</h3>
                            <div style={styles.priorityBar}>
                                <div style={{
                                    ...styles.priorityFill,
                                    width: `${Math.min(complaint.priorityScore * 2, 100)}%`
                                }} />
                            </div>
                            <p style={styles.priorityNumber}>
                                ⚡ {complaint.priorityScore} / 50
                            </p>
                        </div>

                        {/* Votes */}
                        <div style={styles.votesBox}>
                            <div style={styles.voteItem}>
                                <span style={styles.voteIcon}>👍</span>
                                <span style={styles.voteCount}>{complaint.upvotes?.length || 0} Upvotes</span>
                            </div>
                            <div style={styles.voteItem}>
                                <span style={styles.voteIcon}>👎</span>
                                <span style={styles.voteCount}>{complaint.downvotes?.length || 0} Downvotes</span>
                            </div>
                        </div>

                        {/* Progress Tracker */}
                        <h3 style={styles.progressTitle}>Complaint Progress</h3>
                        <div style={styles.progressTracker}>
                            {['Pending', 'In Progress', 'Resolved'].map((step, index) => (
                                <div key={step} style={styles.stepContainer}>
                                    <div style={styles.stepRow}>
                                        <div style={{
                                            ...styles.stepCircle,
                                            background: index <= currentStep ? 'linear-gradient(135deg, var(--primary), #8a2be2)' : 'rgba(255,255,255,0.1)',
                                            color: index <= currentStep ? 'white' : 'rgba(255,255,255,0.4)',
                                            border: index <= currentStep ? 'none' : '1px solid rgba(255,255,255,0.2)',
                                            boxShadow: index <= currentStep ? '0 0 10px var(--primary-glow)' : 'none'
                                        }}>
                                            {index < currentStep ? '✓' : index + 1}
                                        </div>
                                        {index < 2 && (
                                            <div style={{
                                                ...styles.stepLine,
                                                background: index < currentStep ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                            }} />
                                        )}
                                    </div>
                                    <p style={{
                                        ...styles.stepLabel,
                                        color: index <= currentStep ? '#fff' : 'rgba(255,255,255,0.5)',
                                        fontWeight: index === currentStep ? 'bold' : 'normal',
                                    }}>
                                        {step}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Status Message */}
                        <div style={styles.statusMessage}>
                            {complaint.status === 'Pending' && (
                                <p>⏳ Your complaint is pending review. The community is voting on its priority.</p>
                            )}
                            {complaint.status === 'In Progress' && (
                                <p>🔧 Your complaint is being addressed by the {complaint.department} department.</p>
                            )}
                            {complaint.status === 'Resolved' && (
                                <p>✅ Your complaint has been resolved! Thank you for helping improve your community.</p>
                            )}
                        </div>

                        {/* Filed Date */}
                        <p style={styles.date}>
                            📅 Filed on: {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'long', year: 'numeric'
                            })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: { paddingBottom: '80px' },
    nav: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '24px 40px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white',
    },
    logo: { margin: 0, fontSize: '26px', color: '#fff', fontWeight: 800, textShadow: '0 0 15px rgba(255,255,255,0.3)' },
    loading: { textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.6)', fontSize: '18px' },
    content: { padding: '40px', maxWidth: '800px', margin: '0 auto' },
    card: {
        background: 'rgba(255,255,255,0.02)', borderRadius: '20px',
        overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column'
    },
    image: { width: '100%', height: '350px', objectFit: 'cover', borderBottom: '1px solid rgba(255,255,255,0.05)' },
    info: { padding: '40px' },
    title: { color: '#fff', marginBottom: '12px', fontSize: '28px', textShadow: '0 0 10px rgba(255,255,255,0.2)' },
    description: { color: 'rgba(255,255,255,0.7)', marginBottom: '24px', fontSize: '16px', lineHeight: '1.6' },
    tags: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' },
    tag: {},
    priorityBox: {
        background: 'rgba(0,0,0,0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)',
        padding: '24px', marginBottom: '24px',
    },
    priorityTitle: { margin: '0 0 12px', color: '#fff', fontSize: '18px' },
    priorityBar: {
        background: 'rgba(255,255,255,0.1)', borderRadius: '10px',
        height: '12px', marginBottom: '12px', overflow: 'hidden',
    },
    priorityFill: {
        height: '100%', background: 'linear-gradient(to right, var(--primary), var(--secondary))',
        borderRadius: '10px', transition: 'width 0.5s ease', boxShadow: '0 0 10px var(--secondary-glow)'
    },
    priorityNumber: { margin: 0, color: 'var(--secondary)', fontWeight: 'bold', fontSize: '16px', textShadow: '0 0 10px var(--secondary-glow)' },
    votesBox: {
        display: 'flex', gap: '24px', marginBottom: '32px',
        padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)'
    },
    voteItem: { display: 'flex', alignItems: 'center', gap: '8px' },
    voteIcon: { fontSize: '22px' },
    voteCount: { color: '#fff', fontWeight: 'bold', fontSize: '15px' },
    progressTitle: { color: '#fff', marginBottom: '20px', fontSize: '20px' },
    progressTracker: { display: 'flex', marginBottom: '32px' },
    stepContainer: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' },
    stepRow: { display: 'flex', alignItems: 'center', width: '100%' },
    stepCircle: {
        width: '40px', height: '40px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 'bold', fontSize: '16px', flexShrink: 0, transition: 'all 0.3s'
    },
    stepLine: { flex: 1, height: '4px', margin: '0 4px', borderRadius: '2px', transition: 'background 0.3s' },
    stepLabel: { fontSize: '13px', marginTop: '12px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' },
    statusMessage: {
        background: 'rgba(82, 113, 255, 0.1)', borderRadius: '12px', border: '1px solid rgba(82, 113, 255, 0.3)',
        padding: '20px', marginBottom: '20px', color: '#fff', fontSize: '15px', lineHeight: '1.5',
    },
    date: { color: 'rgba(255,255,255,0.5)', fontSize: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' },
};

export default ComplaintProgress;
