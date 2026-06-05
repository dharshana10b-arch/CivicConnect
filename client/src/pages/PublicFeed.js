import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { Tilt } from 'react-tilt';
import { motion } from 'framer-motion';

function PublicFeed() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    const departments = ['All', 'Water', 'Electricity', 'Waste', 'Roads', 'Sanitation', 'Other'];

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/complaints');
            setComplaints(res.data.complaints);
        } catch (error) {
            toast.error('Failed to fetch complaints');
        }
        setLoading(false);
    };

    const handleVote = async (complaintId, voteType) => {
        if (!user) {
            toast.error('Please login to vote!');
            navigate('/login');
            return;
        }
        try {
            const res = await axios.post(
                `http://localhost:5000/api/complaints/${complaintId}/vote`,
                { voteType },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setComplaints(prev =>
                prev.map(c => c._id === complaintId ? res.data.complaint : c)
            );
            toast.success('Vote recorded!');
        } catch (error) {
            toast.error('Failed to vote');
        }
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

    const getStatusColor = (status) => {
        const colors = {
            Pending: '#fbbf24',
            'In Progress': '#3b82f6',
            Resolved: '#10b981'
        };
        return colors[status] || '#fbbf24';
    };

    const filteredComplaints = filter === 'All'
        ? complaints
        : complaints.filter(c => c.department === filter);

    return (
        <div className="page-container" style={styles.container}>
            <nav style={styles.nav}>
                <h1 style={styles.logo}>🏙️ CivicConnect</h1>
                <div style={styles.navRight}>
                    {user ? (
                        <>
                            <span style={styles.avatar}>{user.avatar}</span>
                            <button className="btn-secondary" onClick={() => navigate('/dashboard')}>Dashboard</button>
                            <button className="btn-primary" onClick={() => navigate('/submit')}>+ Report Issue</button>
                        </>
                    ) : (
                        <>
                            <button className="btn-secondary" onClick={() => navigate('/login')}>Login</button>
                            <button className="btn-primary" onClick={() => navigate('/register')}>Register</button>
                        </>
                    )}
                </div>
            </nav>

            <div style={styles.content}>
                <h2 style={styles.pageTitle}>Community Feed</h2>
                <p style={styles.pageSubtitle}>
                    Vote on issues to help prioritize what gets fixed first
                </p>

                {/* Filter Tabs */}
                <div style={styles.filters}>
                    {departments.map(dept => (
                        <button
                            key={dept}
                            className="shiny-badge"
                            style={{
                                ...styles.filterBtn,
                                background: filter === dept ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                color: filter === dept ? '#fff' : 'rgba(255,255,255,0.7)',
                                borderColor: filter === dept ? 'var(--primary)' : 'rgba(255,255,255,0.1)'
                            }}
                            onClick={() => setFilter(dept)}
                        >
                            {dept}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <p style={styles.loading}>Loading complaints...</p>
                ) : filteredComplaints.length === 0 ? (
                    <p style={styles.loading}>No complaints found.</p>
                ) : (
                    <div style={styles.feed}>
                        {filteredComplaints.map((complaint, index) => (
                            <motion.div
                                key={complaint._id}
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.08 }}
                            >
                                <Tilt options={{ max: 8, scale: 1.02, speed: 400, perspective: 1000, glare: true, 'max-glare': 0.1 }}>
                                    <div className="glass-card" style={styles.card}>
                                        {/* Image */}
                                        <img
                                            src={complaint.image}
                                            alt="complaint"
                                            style={styles.image}
                                        />

                                        {/* Content */}
                                        <div style={styles.cardContent}>
                                            <div style={styles.cardHeader}>
                                                <div style={styles.userInfo}>
                                                    <span style={styles.userAvatar}>
                                                        {complaint.user?.avatar || '👤'}
                                                    </span>
                                                    <div>
                                                        <p style={styles.userName}>{complaint.user?.name}</p>
                                                        <p style={styles.userLocality}>{complaint.locality}</p>
                                                    </div>
                                                </div>
                                                <div style={styles.tags}>
                                                    <span className="shiny-badge" style={{
                                                        ...styles.tag,
                                                        color: getSeverityColor(complaint.severity),
                                                        borderColor: getSeverityColor(complaint.severity)
                                                    }}>
                                                        {complaint.severity}
                                                    </span>
                                                    <span className="shiny-badge" style={{
                                                        ...styles.tag,
                                                        color: getStatusColor(complaint.status),
                                                        borderColor: getStatusColor(complaint.status)
                                                    }}>
                                                        {complaint.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <h3 style={styles.complaintTitle} onClick={() => navigate(`/complaint/${complaint._id}`)}>{complaint.title}</h3>
                                            <p style={styles.complaintDesc}>{complaint.description}</p>

                                            <div style={styles.cardFooter}>
                                                <span className="shiny-badge" style={styles.department}>🏢 {complaint.department}</span>
                                                <span style={styles.priorityScore}>
                                                    ⚡ Priority: {complaint.priorityScore}
                                                </span>
                                            </div>

                                            {/* Vote Buttons */}
                                            <div style={styles.voteSection}>
                                                <button
                                                    style={styles.upvoteBtn}
                                                    onClick={() => handleVote(complaint._id, 'upvote')}
                                                >
                                                    👍 {complaint.upvotes?.length || 0}
                                                </button>
                                                <button
                                                    style={styles.downvoteBtn}
                                                    onClick={() => handleVote(complaint._id, 'downvote')}
                                                >
                                                    👎 {complaint.downvotes?.length || 0}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Tilt>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: { paddingBottom: '80px' },
    nav: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '24px 40px', background: 'rgba(255,255,255,0.02)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.05)', color: 'white',
    },
    logo: { margin: 0, fontSize: '26px', color: '#fff', fontWeight: 800, textShadow:'0 0 15px rgba(255,255,255,0.3)' },
    navRight: { display: 'flex', alignItems: 'center', gap: '16px' },
    avatar: { fontSize: '24px' },
    content: { padding: '40px', maxWidth: '800px', margin: '0 auto' },
    pageTitle: { color: '#fff', marginBottom: '12px', fontSize: '36px', textShadow:'0 0 20px rgba(255,255,255,0.2)' },
    pageSubtitle: { color: 'rgba(255,255,255,0.7)', marginBottom: '32px', fontSize: '18px' },
    filters: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' },
    filterBtn: { cursor: 'pointer', fontSize: '14px' },
    loading: { textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '60px', fontSize: '18px' },
    feed: { display: 'flex', flexDirection: 'column', gap: '24px' },
    card: { padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    image: { width: '100%', height: '300px', objectFit: 'cover', borderBottom: '1px solid rgba(255,255,255,0.05)' },
    cardContent: { padding: '30px' },
    cardHeader: {
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '20px',
    },
    userInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
    userAvatar: { fontSize: '32px' },
    userName: { margin: 0, fontWeight: 'bold', color: '#fff', fontSize: '16px' },
    userLocality: { margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)' },
    tags: { display: 'flex', gap: '8px' },
    tag: {},
    complaintTitle: { color: '#fff', margin: '0 0 12px', fontSize: '22px', cursor: 'pointer' },
    complaintDesc: { color: 'rgba(255,255,255,0.7)', fontSize: '15px', margin: '0 0 20px', lineHeight: '1.6' },
    cardFooter: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '24px', fontSize: '14px', color: 'rgba(255,255,255,0.6)',
        paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)'
    },
    department: { color: '#60a5fa', borderColor: '#60a5fa' },
    priorityScore: { color: 'var(--secondary)', fontWeight: 'bold' },
    voteSection: { display: 'flex', gap: '16px' },
    upvoteBtn: {
        flex: 1, padding: '12px', background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px',
        cursor: 'pointer', fontSize: '16px', color: '#34d399', transition: 'all 0.2s', fontWeight: 'bold'
    },
    downvoteBtn: {
        flex: 1, padding: '12px', background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px',
        cursor: 'pointer', fontSize: '16px', color: '#f87171', transition: 'all 0.2s', fontWeight: 'bold'
    },
};

export default PublicFeed;
