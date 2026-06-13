const TEMPLATES = [
  { id: 1, name: 'Classic', desc: 'Clean · Serif  · Corporate', preview: 'minimal' },
  { id: 2, name: 'Mordern', desc: 'Sleek · Stylish ·  Multi-page', preview: 'dark' },
]

function MinimalThumb() {
  return (
    <div style={{ flex: 1, background: '#fff', padding: '16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      {/* Nav */}
      <div style={{ width: '100%', borderBottom: '1px solid #eee', paddingBottom: 6, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 4 }}>
        <span style={{ fontWeight: 'bold', color: '#111' }}>AKSHAT TRIVEDI</span>
        <span style={{ color: '#bbb' }}>Contact</span>
      </div>
      {/* Title */}
      <div style={{ fontSize: 11, fontWeight: 'bold', color: '#111', lineHeight: 1.1, marginBottom: 8 }}>
        Akshat Trivedi<br/>Data Scientist
      </div>
      {/* Description */}
      <div style={{ fontSize: 5, color: '#666', marginBottom: 8, lineHeight: 1.4 }}>
        Professional & passionate<br/>
        developer building excellence
      </div>
      {/* Lines representing content */}
      {[80, 60, 70].map((w, i) => (
        <div key={i} style={{ height: 1, background: '#ddd', border: 'none', marginBottom: 3, width: `${w}%` }} />
      ))}
      {/* Skills area */}
      <div style={{ marginTop: 6, display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['React', 'Node', 'Python'].map((skill, i) => (
          <span key={i} style={{ fontSize: 4, border: '1px solid #ddd', padding: '1px 4px', borderRadius: 2, color: '#666' }}>{skill}</span>
        ))}
      </div>
    </div>
  )
}

function DarkThumb() {
  return (
    <div style={{ flex: 1, background: '#0C0C0E', padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
      {/* Gold decorative circle */}
      <div style={{ position: 'absolute', top: -20, right: -15, width: 70, height: 70, border: '1px solid rgba(201,169,110,0.15)', borderRadius: '50%' }} />
      
      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 5.5, fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>AKSHAT</div>
        <div style={{ fontSize: 4.5, color: 'rgba(255,255,255,0.3)' }}>Portfolio</div>
      </div>
      
      {/* Hero section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        {/* Gold eyebrow */}
        <div style={{ fontSize: 4.5, color: '#C9A96E', letterSpacing: 1.5, marginBottom: 4, fontWeight: 'bold' }}>PROFESSIONAL</div>
        
        {/* Title */}
        <div style={{ fontSize: 12, fontFamily: 'Georgia, serif', fontWeight: 'bold', color: '#fff', lineHeight: 0.95, marginBottom: 8, letterSpacing: -0.5 }}>
          Akshat<br/><em style={{ fontStyle: 'italic', color: '#C9A96E' }}>Trivedi</em>
        </div>
        
        {/* Gold rule */}
        <div style={{ width: 18, height: 1.5, background: 'linear-gradient(90deg, #C9A96E, transparent)', marginBottom: 8 }} />
        
        {/* Tagline */}
        <div style={{ fontSize: 5.5, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', lineHeight: 1.3, marginBottom: 8 }}>
          Data Scientist
        </div>
        
        {/* Skills */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['React', 'Python', 'AWS'].map((skill, i) => (
            <span key={i} style={{ fontSize: 4, color: '#C9A96E', border: '1px solid rgba(201,169,110,0.4)', padding: '2px 6px', letterSpacing: 0.5 }}>{skill}</span>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <div style={{ fontSize: 4, color: 'rgba(255,255,255,0.2)', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        Premium Design
      </div>
    </div>
  )
}

function CreativeThumb() {
  return null  // Removed - no longer using Editorial template
}

const thumbMap = { minimal: MinimalThumb, dark: DarkThumb, creative: CreativeThumb }

export default function TemplatePicker({ selected, onSelect }) {
  return (
    <div>
      <h2 className="section-heading">Choose a Template</h2>
      <p className="section-sub">Pick the style for your downloadable PDF portfolio.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
        {TEMPLATES.map(t => {
          const Thumb = thumbMap[t.preview]
          return (
            <div
              key={t.id}
              className={`template-card ${selected === t.id ? 'selected' : ''}`}
              onClick={() => onSelect(t.id)}
            >
              <div className="template-preview" style={{ height: 160 }}>
                <Thumb />
              </div>
              <div className="template-info">
                <div className="template-name">{t.name}</div>
                <div className="template-desc">{t.desc}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}