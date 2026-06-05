import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

function SubmitComplaint(props) {
    const { token, user } = useAuth();
    const navigate        = useNavigate();
    const location        = useLocation();

    // Get department from URL param — set when coming from department page
    const urlDept = new URLSearchParams(location.search).get('department') || '';

    const [loading,      setLoading]      = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [wrongDeptWarning, setWrongDeptWarning] = useState(null);
    const [formData, setFormData] = useState({
        title:       '',
        description: '',
        department:  urlDept, // pre-filled from URL
        locality:    user?.locality || '',
        image:       null,
    });

    // Pre-fill from URL department whenever it changes
    useEffect(() => {
        if (urlDept) setFormData(prev => ({ ...prev, department: urlDept }));
    }, [urlDept]);

    const processedVoice = React.useRef(null);

    // Pre-fill from AI voice assistant
    useEffect(() => {
        if (props.voiceData && JSON.stringify(props.voiceData) !== processedVoice.current) {
            processedVoice.current = JSON.stringify(props.voiceData);
            setFormData(prev => ({
                ...prev,
                ...(props.voiceData.title       && { title:       props.voiceData.title }),
                ...(props.voiceData.description && { description: props.voiceData.description }),
                ...(props.voiceData.department  && { department:  props.voiceData.department }),
                ...(props.voiceData.locality    && { locality:    props.voiceData.locality }),
            }));
            
            if (props.voiceData.submit) {
                setTimeout(() => {
                    const fakeEvent = { preventDefault: () => {} };
                    handleSubmit(fakeEvent);
                }, 100);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.voiceData]);

    // Trigger image picker from AI assistant
    useEffect(() => {
        if (props.triggerImagePicker) {
            document.getElementById('imageInput').click();
            if (props.onImagePickerDone) props.onImagePickerDone();
        }
    }, [props.triggerImagePicker]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFormData({ ...formData, image: file });
        setImagePreview(URL.createObjectURL(file));
        setWrongDeptWarning(null); // reset warning on new image
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.image) {
            toast.error('Please upload an image!');
            return;
        }
        if (!formData.department) {
            toast.error('Please select a department!');
            return;
        }
        setLoading(true);
        setWrongDeptWarning(null);

        try {
            const data = new FormData();
            data.append('title',       formData.title);
            data.append('description', formData.description);
            data.append('department',  formData.department);
            data.append('locality',    formData.locality);
            data.append('image',       formData.image);

            const res = await axios.post('http://localhost:5000/api/complaints', data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            const { severity, wrongDepartment, suggestedDepartment, duplicateComplaint } = res.data;

            // Wrong department warning
            if (wrongDepartment && suggestedDepartment) {
                setWrongDeptWarning(suggestedDepartment);
                toast.warn(
                    `⚠️ Your image looks like a ${suggestedDepartment} issue, not ${formData.department}. Consider re-filing under ${suggestedDepartment}.`,
                    { autoClose: 6000 }
                );
            }

            // Duplicate warning
            if (duplicateComplaint) {
                toast.warn(
                    `⚠️ A similar complaint already exists! Consider upvoting it instead.`,
                    { autoClose: 5000 }
                );
                setTimeout(() => navigate(`/complaint/${duplicateComplaint._id}`), 3000);
                return;
            }

            toast.success(`✅ Complaint submitted! AI detected severity: ${severity}`);
            setTimeout(() => navigate('/dashboard'), 2000);

        } catch (error) {
            toast.error(error.response?.data?.message || 'Submission failed');
        }
        setLoading(false);
    };

    const DEPT_INFO = {
        Water:       { icon: '💧', color: '#3b82f6' },
        Electricity: { icon: '⚡', color: '#f59e0b' },
        Waste:       { icon: '🗑️', color: '#10b981' },
        Roads:       { icon: '🛣️', color: '#8b5cf6' },
        Sanitation:  { icon: '🧹', color: '#14b8a6' },
        Other:       { icon: '📋', color: '#64748b' },
    };
    const deptInfo = DEPT_INFO[formData.department] || DEPT_INFO.Other;

    return (
        <div className="page-container" style={S.container}>
            {/* Nav */}
            <nav style={S.nav}>
                <h1 style={S.logo}>🏙️ CivicConnect</h1>
                <button className="btn-secondary" onClick={() => navigate('/departments')}>
                    ← Back to Departments
                </button>
            </nav>

            <div style={S.content}>
                <div className="glass-card" style={S.card}>

                    {/* Department badge — shows selected dept, no dropdown */}
                    {formData.department && (
                        <div style={{ ...S.deptBadge, background: `${deptInfo.color}20`, border: `1px solid ${deptInfo.color}40`, color: deptInfo.color }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{fontSize:'18px'}}>{deptInfo.icon}</span> 
                                <span>Filing under: <strong>{formData.department}</strong></span>
                            </div>
                            <button className="btn-secondary" style={{padding:'6px 14px', fontSize:'12px', background: 'rgba(255,255,255,0.05)', color:'#fff', border:'1px solid rgba(255,255,255,0.1)'}} onClick={() => navigate('/departments')}>
                                Change
                            </button>
                        </div>
                    )}

                    <div style={S.headerText}>
                        <h2 style={S.title}>Report a Civic Issue</h2>
                        <p style={S.subtitle}>
                            Upload proof and our Vision AI will analyze its severity automatically.
                        </p>
                    </div>

                    {/* Wrong department warning */}
                    {wrongDeptWarning && (
                        <div style={S.wrongDeptBox}>
                            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                <span style={{fontSize:'20px'}}>⚠️</span>
                                <span>AI thinks this matches <strong>{wrongDeptWarning}</strong> instead.</span>
                            </div>
                            <button
                                style={S.switchDeptBtn}
                                onClick={() => navigate(`/submit?department=${wrongDeptWarning}`)}
                            >
                                Switch Department →
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={S.form}>
                        {/* Image Upload */}
                        <div style={S.imageUpload}>
                            {imagePreview ? (
                                <div style={{position:'relative', display:'flex', flexDirection:'column', alignItems:'center'}}>
                                    <img src={imagePreview} alt="preview" style={S.imagePreview}/>
                                    <button type="button" className="btn-secondary" style={S.changeImageBtn}
                                        onClick={() => document.getElementById('imageInput').click()}>
                                        Replace Image
                                    </button>
                                </div>
                            ) : (
                                <div style={S.uploadPlaceholder}
                                    onClick={() => document.getElementById('imageInput').click()}>
                                    <div style={S.uploadIconCircle}>
                                        <p style={S.uploadIcon}>📸</p>
                                    </div>
                                    <p style={{margin:'0 0 4px', fontSize:'16px', fontWeight:600, color:'#fff'}}>Select an image to upload</p>
                                    <p style={S.uploadHint}>AI needs clear photo proof to analyze severity</p>
                                </div>
                            )}
                            <input
                                id="imageInput"
                                type="file"
                                accept="image/*"
                                onChange={handleImage}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <div style={S.inputGroup}>
                            <label style={S.label}>Issue Title</label>
                            <input
                                className="sleek-input"
                                type="text"
                                name="title"
                                placeholder="e.g. Broken Road on Main St"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div style={S.inputGroup}>
                            <label style={S.label}>Description</label>
                            <textarea
                                className="sleek-input"
                                style={{ resize: 'vertical', minHeight: '120px', paddingTop: '16px' }}
                                name="description"
                                placeholder="Describe the severity and clear details about the civic issue..."
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows={4}
                            />
                        </div>

                        <div style={S.inputGroup}>
                            <label style={S.label}>Pincode / Locality</label>
                            <input
                                className="sleek-input"
                                type="text"
                                name="locality"
                                placeholder="Your exact neighborhood (e.g. Anna Nagar, Chennai)"
                                value={formData.locality}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div style={S.aiNote}>
                            <span style={{fontSize:'18px'}}>🤖</span>
                            <p style={{margin:0, flex:1, lineHeight:1.4}}>
                                <strong>AI Analysis Active.</strong> Your image and description will be processed to dynamically calculate priority before alerting local authorities.
                            </p>
                        </div>

                        <button className="btn-primary" type="submit" disabled={loading} style={{width:'100%', padding:'16px', fontSize:'16px', marginTop:'16px'}}>
                            {loading ? '🔍 Processing via AI...' : 'Submit Issue'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

const S = {
    container:   { paddingBottom: '80px' },
    nav: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '24px 40px', background: 'rgba(255,255,255,0.02)', backdropFilter:'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)', position:'sticky', top:0, zIndex:100,
    },
    logo: { margin: 0, fontSize: '26px', color: '#fff', fontWeight:800 },
    content:     { display:'flex', justifyContent:'center', padding:'40px 20px' },
    card:        { padding:'40px', width:'100%', maxWidth:'640px' },

    deptBadge:   { padding:'16px 20px', borderRadius:'12px', marginBottom:'32px', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'15px', fontWeight:'600' },
    
    headerText:  { textAlign: 'center', marginBottom: '32px' },
    title:       { color:'#fff', marginBottom:'8px', fontSize: '32px', fontWeight: 800, textShadow: '0 0 20px rgba(255,255,255,0.2)' },
    subtitle:    { color:'rgba(255,255,255,0.6)', margin:0, fontSize: '15px' },
    
    wrongDeptBox:{ background:'rgba(245, 158, 11, 0.1)', border:'1px solid rgba(245, 158, 11, 0.3)', borderRadius:'12px', padding:'16px 20px', marginBottom:'24px', fontSize:'14px', color:'#fbbf24', display:'flex', alignItems:'center', justifyContent:'space-between' },
    switchDeptBtn:{ background:'#f59e0b', border:'none', color:'#fff', padding:'8px 16px', borderRadius:'24px', cursor:'pointer', fontSize:'13px', fontWeight:'700', whiteSpace:'nowrap', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' },

    form:        { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup:  { display: 'flex', flexDirection: 'column', gap: '8px' },
    label:       { color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 600, paddingLeft: '4px' },
    
    imageUpload: { marginBottom:'8px' },
    uploadPlaceholder:{ border:'2px dashed rgba(255,255,255,0.2)', borderRadius:'16px', padding:'40px 20px', textAlign:'center', cursor:'pointer', background:'rgba(0,0,0,0.2)', transition: 'all 0.3s ease', display:'flex', flexDirection:'column', alignItems:'center' },
    uploadIconCircle: { width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyCenter: 'center', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.1)' },
    uploadIcon:  { fontSize:'32px', margin:'auto' },
    uploadHint:  { margin:0, fontSize:'13px', color:'rgba(255,255,255,0.5)' },
    imagePreview:{ width:'100%', borderRadius:'16px', maxHeight:'360px', objectFit:'cover', border: '1px solid rgba(255,255,255,0.1)' },
    changeImageBtn: { marginTop:'16px' },
    
    aiNote:      { background:'rgba(59, 130, 246, 0.1)', border:'1px solid rgba(59, 130, 246, 0.2)', padding:'16px 20px', borderRadius:'12px', marginTop:'8px', color:'#93c5fd', fontSize:'13px', display:'flex', alignItems:'center', gap:'12px' },
};

export default SubmitComplaint;