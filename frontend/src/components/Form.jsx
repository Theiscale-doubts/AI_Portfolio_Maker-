import { useState, useEffect, useCallback } from 'react'
import TagInput from './TagInput'

const CACHE_KEY = 'portfolioai_form_cache'

const STEPS = [
  'Personal', 'Links', 'Skills',
  'Experience', 'Projects', 'Education',
  'Achievements', 'Extra'
]

const emptyWork = () => ({
  job_title: '', company: '', location: '',
  start_date: '', end_date: '', description: ''
})

const emptyProject = () => ({
  name: '', description: '', tech_stack: [],
  live_url: '', github_url: '', images: [],
  problem_statement: '', dataset: '', features: '',
  model_approach: '', accuracy: '', results: '', additional_notes: ''
})

const emptyEducation = () => ({
  degree: '', institution: '', start_year: '', end_year: '', grade: ''
})

const emptyAchievement = () => ({
  title: '', organization: '', date: '', credential_url: '', image: '', description: ''
})

// Load saved cache
const loadCache = () => {
  try {
    const saved = localStorage.getItem(CACHE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch { return null }
}

// Save cache
const saveCache = (data) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)) } catch {}
}

// Clear cache
const clearCache = () => {
  try { localStorage.removeItem(CACHE_KEY) } catch {}
}

export default function Form({ onSubmit, loading }) {
  const cache = loadCache()

  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [cacheRestored, setCacheRestored] = useState(!!cache)

  const [personal, setPersonal] = useState(
    cache?.personal || {
      full_name: '',
      professional_title: '',
      email: '',
      bio: '',
      location: '',
      photo: ''
    }
  )
  const [links, setLinks] = useState(
    cache?.links || {
      github: '',
      linkedin: '',
      website: '',
      twitter: ''
    }
  )
  const [skills, setSkills] = useState(
    cache?.skills || {
      technical_skills: [],
      soft_skills: [],
      spoken_languages: []
    }
  )
  const [workList, setWorkList] = useState(cache?.workList || [])
  const [projects, setProjects] = useState(cache?.projects || [emptyProject()])
  const [education, setEducation] = useState(cache?.education || [emptyEducation()])
  const [achievements, setAchievements] = useState(cache?.achievements || [])
  const [extra, setExtra] = useState(
    cache?.extra || { availability: '', open_to_work: false }
  )

  // Auto-save whenever any field changes
  useEffect(() => {
    saveCache({ personal, links, skills, workList, projects, education, achievements, extra })
  }, [personal, links, skills, workList, projects, education, achievements, extra])

  const handleClearCache = () => {
    clearCache()
    setPersonal({ full_name: '', professional_title: '', email: '', bio: '', location: '', photo: '' })
    setLinks({ github: '', linkedin: '', website: '', twitter: '' })
    setSkills({ technical_skills: [], soft_skills: [], spoken_languages: [] })
    setWorkList([])
    setProjects([emptyProject()])
    setEducation([emptyEducation()])
    setAchievements([])
    setExtra({ availability: '', open_to_work: false })
    setCacheRestored(false)
    setStep(0)
  }

  // ── Validators ──────────────────────────────────────────────────────────

  const validate = () => {
    setError('')
    if (step === 0) {
      if (!personal.full_name.trim()) return setError('Full name is required'), false
      if (!personal.professional_title.trim()) return setError('Professional title is required'), false
      if (!personal.email.trim()) return setError('Email is required'), false
      if (!personal.bio.trim()) return setError('Bio / summary is required'), false
    }
    if (step === 2) {
      if (skills.technical_skills.length === 0) return setError('Add at least one technical skill'), false
    }
    if (step === 4) {
      for (let i = 0; i < projects.length; i++) {
        if (!projects[i].name.trim()) return setError(`Project ${i + 1} needs a name`), false
        if (!projects[i].description.trim()) return setError(`Project ${i + 1} needs a description`), false
        if (projects[i].tech_stack.length === 0) return setError(`Project ${i + 1} needs at least one tech tag`), false
      }
    }
    if (step === 5) {
      for (let i = 0; i < education.length; i++) {
        if (!education[i].degree.trim()) return setError(`Education ${i + 1} needs a degree`), false
        if (!education[i].institution.trim()) return setError(`Education ${i + 1} needs an institution`), false
      }
    }
    return true
  }

  const next = () => { if (validate()) setStep(s => s + 1) }
  const prev = () => { setError(''); setStep(s => s - 1) }

  const handleSubmit = () => {
    if (!validate()) return
    const payload = {
      ...personal,
      ...links,
      ...skills,
      work_experience: workList,
      projects,
      education,
      achievements,
      ...extra,
    }
    onSubmit(payload)
  }

  // ── Work helpers ─────────────────────────────────────────────────────────

  const updateWork = (idx, field, val) => {
    setWorkList(prev => prev.map((w, i) => i === idx ? { ...w, [field]: val } : w))
  }
  const addWork = () => setWorkList(prev => [...prev, emptyWork()])
  const removeWork = (idx) => setWorkList(prev => prev.filter((_, i) => i !== idx))

  // ── Project helpers ───────────────────────────────────────────────────────

  const updateProject = (idx, field, val) => {
    setProjects(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p))
  }
  const addProject = () => setProjects(prev => [...prev, emptyProject()])
  const removeProject = (idx) => setProjects(prev => prev.filter((_, i) => i !== idx))

  const handleProjectImages = (idx, files) => {
    const remaining = 3 - (projects[idx].images?.length || 0)
    const selected = Array.from(files).slice(0, remaining)
    selected.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProjects(prev => prev.map((p, i) => {
          if (i !== idx) return p
          const updated = [...(p.images || []), reader.result]
          return { ...p, images: updated.slice(0, 3) }
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeProjectImage = (projIdx, imgIdx) => {
    setProjects(prev => prev.map((p, i) =>
      i === projIdx ? { ...p, images: p.images.filter((_, j) => j !== imgIdx) } : p
    ))
  }

  const handleAchievementImage = (idx, file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setAchievements(prev => prev.map((a, i) =>
        i === idx ? { ...a, image: reader.result } : a
      ))
    }
    reader.readAsDataURL(file)
  }

  const removeAchievementImage = (idx) => {
    setAchievements(prev => prev.map((a, i) =>
      i === idx ? { ...a, image: '' } : a
    ))
  }

  // ── Education helpers ─────────────────────────────────────────────────────

  const updateEdu = (idx, field, val) => {
    setEducation(prev => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e))
  }
  const addEdu = () => setEducation(prev => [...prev, emptyEducation()])
  const removeEdu = (idx) => setEducation(prev => prev.filter((_, i) => i !== idx))

  // ── Achievement helpers ───────────────────────────────────────────────────

  const updateAch = (idx, field, val) => {
    setAchievements(prev => prev.map((a, i) => i === idx ? { ...a, [field]: val } : a))
  }
  const addAch = () => setAchievements(prev => [...prev, emptyAchievement()])
  const removeAch = (idx) => setAchievements(prev => prev.filter((_, i) => i !== idx))

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Step Progress */}
      <div className="step-progress">
        {STEPS.map((label, i) => (
          <div key={i} className="step-item">
            <div className="step-wrapper">
              <div className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <div className="step-label">{label}</div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-line ${i < step ? 'done' : ''}`} />
            )}
          </div>
        ))}
      </div>

      <div className="card">
        {error && <div className="error-banner">⚠ {error}</div>}

        {/* Cache restored banner */}
        {cacheRestored && (
          <div style={{
            background: 'rgba(52,211,153,0.08)',
            border: '1px solid rgba(52,211,153,0.3)',
            borderRadius: 8,
            padding: '10px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
          }}>
            <span style={{ color: '#34d399' }}>
              ✓ Your previous inputs have been restored automatically
            </span>
            <button
              onClick={handleClearCache}
              style={{
                background: 'none',
                border: '1px solid rgba(248,113,113,0.4)',
                color: '#f87171',
                borderRadius: 6,
                padding: '3px 12px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Clear &amp; Start Fresh
            </button>
          </div>
        )}

        {/* ── Step 0: Personal Info ───────────────────────────────────────── */}
        {step === 0 && (
          <>
            <h2 className="section-heading">Personal Info</h2>
            <p className="section-sub">The essentials that define you professionally.</p>

            {/* Profile Photo - top of form, prominent */}
            <div className="form-group">
              <label>Profile Photo <span className="opt">(optional)</span></label>
              <div style={{
                background: '#16161f',
                border: '1px solid #252533',
                borderRadius: 12,
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 24,
              }}>
                {/* Circle avatar */}
                <div style={{ flexShrink: 0, position: 'relative', width: 96, height: 96 }}>
                  {personal.photo ? (
                    <>
                      <img
                        src={personal.photo}
                        alt="Profile"
                        style={{
                          width: 96, height: 96,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '3px solid #7c6dfa',
                          display: 'block',
                        }}
                      />
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => setPersonal(p => ({ ...p, photo: '' }))}
                        style={{
                          position: 'absolute', top: 0, right: 0,
                          width: 24, height: 24,
                          borderRadius: '50%',
                          background: '#f87171',
                          border: 'none',
                          color: '#fff',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          lineHeight: 1,
                        }}
                      >×</button>
                    </>
                  ) : (
                    <label style={{
                      width: 96, height: 96,
                      borderRadius: '50%',
                      border: '2px dashed #3a3a55',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: '#0a0a0f',
                      transition: 'border-color 0.2s',
                    }}>
                      <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>👤</span>
                      <span style={{ fontSize: '0.6rem', color: '#7a7a9a', marginTop: 5, letterSpacing: 0.5 }}>UPLOAD</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files[0]
                          if (!file) return
                          const reader = new FileReader()
                          reader.onloadend = () => setPersonal(p => ({ ...p, photo: reader.result }))
                          reader.readAsDataURL(file)
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Text info */}
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#f0f0f8', marginBottom: 6 }}>
                    {personal.photo ? '✓ Profile photo uploaded' : 'Upload your profile photo'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#7a7a9a', lineHeight: 1.7 }}>
                    Appears on the cover page of your PDF.<br />
                    Use a square headshot for best results.<br />
                    JPG, PNG or WEBP supported.
                  </div>
                  {!personal.photo && (
                    <label style={{
                      display: 'inline-block',
                      marginTop: 10,
                      padding: '6px 16px',
                      background: '#7c6dfa',
                      color: '#fff',
                      borderRadius: 6,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}>
                      Choose Photo
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files[0]
                          if (!file) return
                          const reader = new FileReader()
                          reader.onloadend = () => setPersonal(p => ({ ...p, photo: reader.result }))
                          reader.readAsDataURL(file)
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Full Name <span className="req">*</span></label>
                <input type="text" placeholder="Jane Doe"
                  name="name" autoComplete="name"
                  value={personal.full_name}
                  onChange={e => setPersonal({ ...personal, full_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Professional Title <span className="req">*</span></label>
                <input type="text" placeholder="Full Stack Developer"
                  name="organization-title" autoComplete="organization-title"
                  value={personal.professional_title}
                  onChange={e => setPersonal({ ...personal, professional_title: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email <span className="req">*</span></label>
                <input type="email" placeholder="jane@example.com"
                  name="email" autoComplete="email"
                  value={personal.email}
                  onChange={e => setPersonal({ ...personal, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Location <span className="opt">(optional)</span></label>
                <input type="text" placeholder="Raipur, India"
                  name="address-level2" autoComplete="address-level2"
                  value={personal.location}
                  onChange={e => setPersonal({ ...personal, location: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Bio / Summary <span className="req">*</span></label>
              <textarea placeholder="A brief description of who you are, what you do, and what makes you unique..."
                name="bio" autoComplete="off"
                value={personal.bio}
                onChange={e => setPersonal({ ...personal, bio: e.target.value })} />
            </div>
          </>
        )}

        {/* ── Step 1: Links ──────────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <h2 className="section-heading">Links & Social</h2>
            <p className="section-sub">Where can people find you? All optional but strongly recommended.</p>

            <div className="form-row">
              <div className="form-group">
                <label>GitHub <span className="opt">(optional)</span></label>
                <input type="url" placeholder="https://github.com/username"
                  name="github" autoComplete="url"
                  value={links.github}
                  onChange={e => setLinks({ ...links, github: e.target.value })} />
              </div>
              <div className="form-group">
                <label>LinkedIn <span className="opt">(optional)</span></label>
                <input type="url" placeholder="https://linkedin.com/in/username"
                  name="linkedin" autoComplete="url"
                  value={links.linkedin}
                  onChange={e => setLinks({ ...links, linkedin: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Personal Website <span className="opt">(optional)</span></label>
                <input type="url" placeholder="https://yourwebsite.com"
                  name="url" autoComplete="url"
                  value={links.website}
                  onChange={e => setLinks({ ...links, website: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Twitter / X <span className="opt">(optional)</span></label>
                <input type="url" placeholder="https://twitter.com/username"
                  name="twitter" autoComplete="url"
                  value={links.twitter}
                  onChange={e => setLinks({ ...links, twitter: e.target.value })} />
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: Skills ─────────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <h2 className="section-heading">Skills</h2>
            <p className="section-sub">Type a skill and press Enter or comma to add it as a tag.</p>

            <div className="form-group">
              <label>Technical Skills <span className="req">*</span></label>
              <TagInput
                tags={skills.technical_skills}
                onChange={val => setSkills({ ...skills, technical_skills: val })}
                placeholder="React, Python, AWS, Docker..."
              />
            </div>
            <div className="form-group">
              <label>Soft Skills <span className="opt">(optional)</span></label>
              <TagInput
                tags={skills.soft_skills}
                onChange={val => setSkills({ ...skills, soft_skills: val })}
                placeholder="Leadership, Communication..."
              />
            </div>
            <div className="form-group">
              <label>Spoken Languages <span className="opt">(optional)</span></label>
              <TagInput
                tags={skills.spoken_languages}
                onChange={val => setSkills({ ...skills, spoken_languages: val })}
                placeholder="English, Hindi, French..."
              />
            </div>
          </>
        )}

        {/* ── Step 3: Work Experience ────────────────────────────────────── */}
        {step === 3 && (
          <>
            <h2 className="section-heading">Work Experience</h2>
            <p className="section-sub">Add your work history. Skip this step if you're a student or fresher.</p>

            {workList.map((job, idx) => (
              <div className="entry-card" key={idx}>
                <div className="entry-card-header">
                  <span className="entry-card-title">Job #{idx + 1}</span>
                  <button className="btn btn-danger" onClick={() => removeWork(idx)}>Remove</button>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Job Title</label>
                    <input type="text" placeholder="Software Engineer"
                      value={job.job_title}
                      onChange={e => updateWork(idx, 'job_title', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Company</label>
                    <input type="text" placeholder="Acme Inc."
                      value={job.company}
                      onChange={e => updateWork(idx, 'company', e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Location <span className="opt">(optional)</span></label>
                    <input type="text" placeholder="Remote / Bangalore, IN"
                      value={job.location}
                      onChange={e => updateWork(idx, 'location', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label>Start</label>
                      <input type="text" placeholder="Jan 2022"
                        value={job.start_date}
                        onChange={e => updateWork(idx, 'start_date', e.target.value)} />
                    </div>
                    <div>
                      <label>End</label>
                      <input type="text" placeholder="Present"
                        value={job.end_date}
                        onChange={e => updateWork(idx, 'end_date', e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Responsibilities / Description</label>
                  <textarea placeholder="Describe your key responsibilities and achievements. The AI will polish this."
                    value={job.description}
                    onChange={e => updateWork(idx, 'description', e.target.value)} />
                </div>
              </div>
            ))}

            <button className="btn btn-ghost" onClick={addWork}>
              + Add Work Experience
            </button>
          </>
        )}

        {/* ── Step 4: Projects ───────────────────────────────────────────── */}
        {step === 4 && (
          <>
            <h2 className="section-heading">Projects</h2>
            <p className="section-sub">Showcase what you've built. At least one project is required.</p>

            {projects.map((proj, idx) => (
              <div className="entry-card" key={idx}>
                <div className="entry-card-header">
                  <span className="entry-card-title">Project #{idx + 1}</span>
                  {projects.length > 1 && (
                    <button className="btn btn-danger" onClick={() => removeProject(idx)}>Remove</button>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Project Name <span className="req">*</span></label>
                    <input type="text" placeholder="E-Commerce Platform"
                      value={proj.name}
                      onChange={e => updateProject(idx, 'name', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description <span className="req">*</span></label>
                  <textarea placeholder="What does it do? What problem does it solve? What was your role?"
                    value={proj.description}
                    onChange={e => updateProject(idx, 'description', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Tech Stack <span className="req">*</span></label>
                  <TagInput
                    tags={proj.tech_stack}
                    onChange={val => updateProject(idx, 'tech_stack', val)}
                    placeholder="React, Node.js, MongoDB..."
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Live URL <span className="opt">(optional)</span></label>
                    <input type="url" placeholder="https://myproject.com"
                      value={proj.live_url}
                      onChange={e => updateProject(idx, 'live_url', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>GitHub URL <span className="opt">(optional)</span></label>
                    <input type="url" placeholder="https://github.com/user/repo"
                      value={proj.github_url}
                      onChange={e => updateProject(idx, 'github_url', e.target.value)} />
                  </div>
                </div>

                {/* Optional Fields */}
                <div style={{
                  marginTop: 16,
                  padding: '16px 18px',
                  background: 'rgba(124,109,250,0.04)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  marginBottom: 4,
                }}>
                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: 'var(--accent)',
                    marginBottom: 14,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}>
                    Optional Fields
                  </div>

                  <div className="form-group">
                    <label>Problem Statement <span className="opt">(optional)</span></label>
                    <textarea placeholder="What problem does this project solve?"
                      style={{ minHeight: 60 }}
                      value={proj.problem_statement || ''}
                      onChange={e => updateProject(idx, 'problem_statement', e.target.value)} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Dataset <span className="opt">(optional)</span></label>
                      <input type="text" placeholder="e.g. Kaggle Titanic, 10k rows, 12 features"
                        value={proj.dataset || ''}
                        onChange={e => updateProject(idx, 'dataset', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Accuracy / Score <span className="opt">(optional)</span></label>
                      <input type="text" placeholder="e.g. 94.3% Accuracy, F1: 0.91"
                        value={proj.accuracy || ''}
                        onChange={e => updateProject(idx, 'accuracy', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Approach <span className="opt">(optional)</span></label>
                    <input type="text" placeholder="e.g. Random Forest, LSTM, XGBoost, BERT fine-tuning"
                      value={proj.model_approach || ''}
                      onChange={e => updateProject(idx, 'model_approach', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Results &amp; Insights <span className="opt">(optional)</span></label>
                    <textarea placeholder="Key findings, business impact, visualizations, or conclusions..."
                      style={{ minHeight: 70 }}
                      value={proj.results || ''}
                      onChange={e => updateProject(idx, 'results', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Additional Notes <span className="opt">(optional)</span></label>
                    <input type="text" placeholder="Deployment, limitations, future work..."
                      value={proj.additional_notes || ''}
                      onChange={e => updateProject(idx, 'additional_notes', e.target.value)} />
                  </div>
                </div>

                {/* Image Upload — 1 image, square style */}
                <div className="form-group">
                  <label>Project Screenshot <span className="opt">(optional · 1 image)</span></label>
                  <div style={{
                    background: '#16161f',
                    border: '1px solid #252533',
                    borderRadius: 12,
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 24,
                  }}>
                    {/* Square thumbnail */}
                    <div style={{ flexShrink: 0, position: 'relative', width: 96, height: 96 }}>
                      {(proj.images && proj.images[0]) ? (
                        <>
                          <img
                            src={proj.images[0]}
                            alt="Project preview"
                            style={{
                              width: 96, height: 96,
                              borderRadius: 10,
                              objectFit: 'cover',
                              border: '3px solid #7c6dfa',
                              display: 'block',
                            }}
                          />
                          <button
                            type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => updateProject(idx, 'images', [])}
                            style={{
                              position: 'absolute', top: -6, right: -6,
                              width: 22, height: 22,
                              borderRadius: '50%',
                              background: '#f87171',
                              border: 'none',
                              color: '#fff',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              lineHeight: 1,
                            }}
                          >×</button>
                        </>
                      ) : (
                        <label style={{
                          width: 96, height: 96,
                          borderRadius: 10,
                          border: '2px dashed #3a3a55',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          background: '#0a0a0f',
                          transition: 'border-color 0.2s',
                        }}>
                          <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>📷</span>
                          <span style={{ fontSize: '0.6rem', color: '#7a7a9a', marginTop: 5, letterSpacing: 0.5 }}>UPLOAD</span>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={e => {
                              const file = e.target.files[0]
                              if (!file) return
                              const reader = new FileReader()
                              reader.onloadend = () => updateProject(idx, 'images', [reader.result])
                              reader.readAsDataURL(file)
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Text info */}
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#f0f0f8', marginBottom: 6 }}>
                        {(proj.images && proj.images[0]) ? '✓ Screenshot uploaded' : 'Upload a project screenshot'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#7a7a9a', lineHeight: 1.7 }}>
                        Shown in the PDF next to your project.<br />
                        JPG, PNG or WEBP supported.
                      </div>
                      {!(proj.images && proj.images[0]) && (
                        <label style={{
                          display: 'inline-block',
                          marginTop: 10,
                          padding: '6px 16px',
                          background: '#7c6dfa',
                          color: '#fff',
                          borderRadius: 6,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}>
                          Choose Image
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={e => {
                              const file = e.target.files[0]
                              if (!file) return
                              const reader = new FileReader()
                              reader.onloadend = () => updateProject(idx, 'images', [reader.result])
                              reader.readAsDataURL(file)
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button className="btn btn-ghost" onClick={addProject}>
              + Add Another Project
            </button>
          </>
        )}

        {/* ── Step 5: Education ──────────────────────────────────────────── */}
        {step === 5 && (
          <>
            <h2 className="section-heading">Education</h2>
            <p className="section-sub">Your academic background.</p>

            {education.map((edu, idx) => (
              <div className="entry-card" key={idx}>
                <div className="entry-card-header">
                  <span className="entry-card-title">Education #{idx + 1}</span>
                  {education.length > 1 && (
                    <button className="btn btn-danger" onClick={() => removeEdu(idx)}>Remove</button>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Degree / Certificate <span className="req">*</span></label>
                    <input type="text" placeholder="B.Tech in Computer Science"
                      value={edu.degree}
                      onChange={e => updateEdu(idx, 'degree', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Institution <span className="req">*</span></label>
                    <input type="text" placeholder="NIT Raipur"
                      value={edu.institution}
                      onChange={e => updateEdu(idx, 'institution', e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Year</label>
                    <input type="text" placeholder="2020"
                      value={edu.start_year}
                      onChange={e => updateEdu(idx, 'start_year', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>End Year</label>
                    <input type="text" placeholder="2024 / Present"
                      value={edu.end_year}
                      onChange={e => updateEdu(idx, 'end_year', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Grade / GPA <span className="opt">(optional)</span></label>
                  <input type="text" placeholder="8.5 CGPA / First Class"
                    value={edu.grade}
                    onChange={e => updateEdu(idx, 'grade', e.target.value)} />
                </div>
              </div>
            ))}

            <button className="btn btn-ghost" onClick={addEdu}>
              + Add More Education
            </button>
          </>
        )}

        {/* ── Step 6: Achievements ───────────────────────────────────────── */}
        {step === 6 && (
          <>
            <h2 className="section-heading">Certifications & Achievements</h2>
            <p className="section-sub">Awards, certifications, hackathons — all optional. AI will write a learning summary for each.</p>

            {achievements.map((ach, idx) => (
              <div className="entry-card" key={idx}>
                <div className="entry-card-header">
                  <span className="entry-card-title">Certification #{idx + 1}</span>
                  <button className="btn btn-danger" onClick={() => removeAch(idx)}>Remove</button>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Title</label>
                    <input type="text" placeholder="AWS Solutions Architect"
                      value={ach.title}
                      onChange={e => updateAch(idx, 'title', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Organization</label>
                    <input type="text" placeholder="Amazon Web Services"
                      value={ach.organization}
                      onChange={e => updateAch(idx, 'organization', e.target.value)} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date</label>
                    <input type="text" placeholder="Mar 2024"
                      value={ach.date}
                      onChange={e => updateAch(idx, 'date', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Credential URL <span className="opt">(optional)</span></label>
                    <input type="url" placeholder="https://credly.com/..."
                      value={ach.credential_url}
                      onChange={e => updateAch(idx, 'credential_url', e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    What did you learn? <span className="opt">(optional · AI will enhance this)</span>
                  </label>
                  <textarea
                    placeholder="Briefly describe what you learned, skills gained, or why you pursued this certification..."
                    style={{ minHeight: 70 }}
                    value={ach.description || ''}
                    onChange={e => updateAch(idx, 'description', e.target.value)}
                  />
                </div>

                {/* Certificate Image — exact copy of project screenshot block */}
                <div className="form-group">
                  <label>Certificate Image <span className="opt">(optional)</span></label>
                  <div style={{
                    background: '#16161f',
                    border: '1px solid #252533',
                    borderRadius: 12,
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 24,
                  }}>
                    {/* Square thumbnail */}
                    <div style={{ flexShrink: 0, position: 'relative', width: 96, height: 96 }}>
                      {ach.image ? (
                        <>
                          <img
                            src={ach.image}
                            alt="Certificate preview"
                            style={{
                              width: 96, height: 96,
                              borderRadius: 10,
                              objectFit: 'cover',
                              border: '3px solid #7c6dfa',
                              display: 'block',
                            }}
                          />
                          <button
                            type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => updateAch(idx, 'image', '')}
                            style={{
                              position: 'absolute', top: -6, right: -6,
                              width: 22, height: 22,
                              borderRadius: '50%',
                              background: '#f87171',
                              border: 'none',
                              color: '#fff',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              lineHeight: 1,
                            }}
                          >×</button>
                        </>
                      ) : (
                        <label style={{
                          width: 96, height: 96,
                          borderRadius: 10,
                          border: '2px dashed #3a3a55',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          background: '#0a0a0f',
                          transition: 'border-color 0.2s',
                        }}>
                          <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>🏆</span>
                          <span style={{ fontSize: '0.6rem', color: '#7a7a9a', marginTop: 5, letterSpacing: 0.5 }}>UPLOAD</span>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={e => {
                              const file = e.target.files[0]
                              if (!file) return
                              const reader = new FileReader()
                              reader.onloadend = () => updateAch(idx, 'image', reader.result)
                              reader.readAsDataURL(file)
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Text info */}
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#f0f0f8', marginBottom: 6 }}>
                        {ach.image ? '✓ Certificate image uploaded' : 'Upload a certificate image'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#7a7a9a', lineHeight: 1.7 }}>
                        Photo of your certificate or badge.<br />
                        JPG, PNG or WEBP supported.
                      </div>
                      {!ach.image && (
                        <label style={{
                          display: 'inline-block',
                          marginTop: 10,
                          padding: '6px 16px',
                          background: '#7c6dfa',
                          color: '#fff',
                          borderRadius: 6,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}>
                          Choose Image
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={e => {
                              const file = e.target.files[0]
                              if (!file) return
                              const reader = new FileReader()
                              reader.onloadend = () => updateAch(idx, 'image', reader.result)
                              reader.readAsDataURL(file)
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            ))}

            <button className="btn btn-ghost" onClick={addAch}>
              + Add Certification / Achievement
            </button>
          </>
        )}

        {/* ── Step 7: Extra ──────────────────────────────────────────────── */}
        {step === 7 && (
          <>
            <h2 className="section-heading">Final Details</h2>
            <p className="section-sub">A few last touches before we generate your portfolio.</p>

            <div className="form-group">
              <label>Availability <span className="opt">(optional)</span></label>
              <input type="text" placeholder="Open to Full-time / Freelance / Internship..."
                value={extra.availability}
                onChange={e => setExtra({ ...extra, availability: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Open to Work</label>
              <div className="toggle-row">
                <div
                  className={`toggle ${extra.open_to_work ? 'on' : ''}`}
                  onClick={() => setExtra({ ...extra, open_to_work: !extra.open_to_work })}
                >
                  <div className="toggle-thumb" />
                </div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-soft)' }}>
                  {extra.open_to_work ? '✓ Yes, I am open to new opportunities' : 'Not currently looking'}
                </span>
              </div>
            </div>

            <div style={{
              marginTop: 28,
              padding: '18px 20px',
              background: 'rgba(124, 109, 250, 0.06)',
              border: '1px solid rgba(124, 109, 250, 0.2)',
              borderRadius: 'var(--radius)',
            }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 6 }}>
                🚀 Ready to generate!
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                The AI will read all your inputs and generate a polished, professional portfolio with
                enhanced descriptions, a compelling summary, and a tagline. You'll then pick one of
                3 templates and download your PDF.
              </div>
            </div>
          </>
        )}

        {/* ── Nav Buttons ─────────────────────────────────────────────────── */}
        <div className="btn-nav-row">
          <button className="btn btn-secondary" onClick={prev} disabled={step === 0}>
            ← Back
          </button>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={next}>
              Continue →
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Generating...' : '✨ Generate Portfolio'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}