export default function Portfolio({ portfolio }) {
  const { ai_content = {}, ...data } = portfolio
  const summary = ai_content.summary || data.bio
  const tagline = ai_content.tagline || ''
  const projects = ai_content.projects?.length ? ai_content.projects : data.projects
  const workList = ai_content.work_experience?.length ? ai_content.work_experience : data.work_experience

  return (
    <div className="portfolio-preview">

      {/* Header */}
      <div className="preview-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
        {data.photo && (
          <img src={data.photo} alt={data.full_name} style={{
            width: 80, height: 80, borderRadius: '50%',
            objectFit: 'cover', border: '2px solid var(--border)',
            flexShrink: 0,
          }} />
        )}
        <div>
          <div className="preview-name">{data.full_name}</div>
          <div className="preview-title">{data.professional_title}</div>
          {tagline && <div className="preview-tagline">"{tagline}"</div>}
          <div className="preview-contact">
            <span>{data.email}</span>
            {data.location && <span>📍 {data.location}</span>}
            {data.github && <a href={data.github} target="_blank" rel="noreferrer">GitHub ↗</a>}
            {data.linkedin && <a href={data.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
            {data.website && <a href={data.website} target="_blank" rel="noreferrer">Website ↗</a>}
            {data.availability && <span style={{ color: 'var(--success)' }}>● {data.availability}</span>}
            {data.open_to_work && <span style={{ color: 'var(--success)', fontWeight: 600 }}>Open to Work</span>}
          </div>
        </div>
      </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="preview-section">
          <div className="preview-section-title">Profile</div>
          <div className="preview-summary">{summary}</div>
        </div>
      )}

      {/* Skills */}
      <div className="preview-section">
        <div className="preview-section-title">Skills</div>
        <div className="skill-cloud">
          {data.technical_skills.map(s => (
            <span key={s} className="skill-chip">{s}</span>
          ))}
        </div>
        {data.soft_skills?.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>SOFT SKILLS</div>
            <div className="skill-cloud">
              {data.soft_skills.map(s => (
                <span key={s} className="skill-chip" style={{ borderColor: 'var(--border)', opacity: 0.7 }}>{s}</span>
              ))}
            </div>
          </div>
        )}
        {data.spoken_languages?.length > 0 && (
          <div style={{ marginTop: 10, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-soft)' }}>Languages:</strong> {data.spoken_languages.join(', ')}
          </div>
        )}
      </div>

      {/* Work Experience */}
      {workList?.length > 0 && (
        <div className="preview-section">
          <div className="preview-section-title">Work Experience</div>
          {workList.map((job, i) => (
            <div className="exp-item" key={i}>
              <div className="exp-item-header">
                <div className="item-title">{job.job_title} — {job.company}</div>
                <div className="item-date">{job.start_date} – {job.end_date}</div>
              </div>
              {job.location && <div className="item-subtitle">{job.location}</div>}
              <div className="item-desc">
                {(job.enhanced_description || job.description).split('\n').filter(l => l.trim()).map((line, j) => (
                  <div key={j}>• {line.trim()}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {projects?.length > 0 && (
        <div className="preview-section">
          <div className="preview-section-title">Projects</div>
          {projects.map((proj, i) => (
            <div className="proj-item" key={i}>
              <div className="proj-item-header">
                <div className="item-title">{proj.name}</div>
              </div>
              <div className="item-desc">
                {proj.enhanced_description || proj.description}
              </div>
              <div className="item-tags">
                {proj.tech_stack.map(t => (
                  <span key={t} className="item-tag">{t}</span>
                ))}
              </div>
              {proj.images?.length > 0 && (
                <div className="proj-images">
                  {proj.images.map((src, i) => (
                    <img key={i} src={src} alt={`${proj.name} screenshot ${i + 1}`} className="proj-img" />
                  ))}
                </div>
              )}
              {(proj.github_url || proj.live_url) && (
                <div className="item-links">
                  {proj.github_url && <a href={proj.github_url} target="_blank" rel="noreferrer">GitHub ↗</a>}
                  {proj.live_url && <a href={proj.live_url} target="_blank" rel="noreferrer">Live Demo ↗</a>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {data.education?.length > 0 && (
        <div className="preview-section">
          <div className="preview-section-title">Education</div>
          {data.education.map((edu, i) => (
            <div className="edu-item" key={i}>
              <div className="exp-item-header">
                <div className="item-title">{edu.degree}</div>
                <div className="item-date">{edu.start_year} – {edu.end_year}</div>
              </div>
              <div className="item-subtitle">
                {edu.institution}{edu.grade ? ` · ${edu.grade}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Achievements */}
      {data.achievements?.length > 0 && (
        <div className="preview-section">
          <div className="preview-section-title">Certifications & Achievements</div>
          {data.achievements.map((ach, i) => (
            <div className="ach-item" key={i}>
              <div className="exp-item-header">
                <div className="item-title">{ach.title}</div>
                <div className="item-date">{ach.date}</div>
              </div>
              <div className="item-subtitle">{ach.organization}</div>
              {ach.image && (
                <div style={{ marginTop: 10 }}>
                  <img src={ach.image} alt={ach.title} style={{
                    width: 200, height: 130, objectFit: 'cover',
                    borderRadius: 6, border: '1px solid var(--border)'
                  }} />
                </div>
              )}
              {ach.credential_url && (
                <div className="item-links">
                  <a href={ach.credential_url} target="_blank" rel="noreferrer">View Credential ↗</a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  )
}