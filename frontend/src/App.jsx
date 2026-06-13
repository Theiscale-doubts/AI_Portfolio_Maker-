import { useState } from 'react'
import axios from 'axios'
import Form from './components/Form'
import Portfolio from './components/Portfolio'
import TemplatePicker from './components/TemplatePicker'
import DownloadBtn from './components/DownloadBtn'
import Loader from './components/Loader'

// Views: 'form' | 'result'
export default function App() {
  const [view, setView] = useState('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [portfolio, setPortfolio] = useState(null)
  const [templateId, setTemplateId] = useState(1)
  const [orientation, setOrientation] = useState('portrait') // 'portrait' | 'landscape'

  const handleGenerate = async (formData) => {
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(
        'https://ai-portfolio-maker-mark-1.onrender.com/api/generate', // ✅ FIXED ENDPOINT
        formData
      )

      console.log('Backend response:', res.data)

      if (!res.data?.portfolio) {
        console.error('No portfolio data in response:', res.data)
        setError('Invalid response from backend: portfolio data missing')
        setLoading(false)
        return
      }

      setPortfolio(res.data.portfolio)
      setView('result')
      window.scrollTo({ top: 0, behavior: 'smooth' })

    } catch (err) {
      console.error('Error generating portfolio:', err)
      setError(
        err?.response?.data?.detail ||
        'Something went wrong. Make sure the backend is running at https://ai-portfolio-maker-3n5i.onrender.com'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = () => {
    setView('form')
    setPortfolio(null)
    setTemplateId(1)
    setOrientation('portrait')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-wrapper">
      {loading && (
        <Loader
          text="AI is crafting your portfolio..."
          sub="AI is polishing your content — this takes ~5 seconds"
        />
      )}

      {/* Nav */}
      <nav className="app-nav">
        <div className="nav-logo">
          Portfolio<span>AI</span>
        </div>
      </nav>

      <main className="app-main">

        {/* ── FORM VIEW ─────────────────────────────────────────────────── */}
        {view === 'form' && (
          <>
            <div className="hero">
              <h1>
                Build Your <span className="gradient">Portfolio</span><br />
                in Minutes
              </h1>
              <p>
                Fill in your details, let AI enhance your content,
                pick a template and download a stunning PDF.
              </p>
            </div>

            {error && (
              <div className="error-banner" style={{ maxWidth: 600, margin: '0 auto 24px' }}>
                ⚠ {error}
              </div>
            )}

            <Form onSubmit={handleGenerate} loading={loading} />
          </>
        )}

        {/* ── RESULT VIEW ───────────────────────────────────────────────── */}
        {view === 'result' && portfolio && (
          <>
            {/* Success banner */}
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div className="success-icon">✓</div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
                Your Portfolio is Ready!
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                AI has enhanced your content. Select a template and download your PDF.
              </p>
            </div>

            {/* Template Picker */}
            <div className="card" style={{ marginBottom: 20 }}>
              <TemplatePicker selected={templateId} onSelect={setTemplateId} />
            </div>

            {/* Action Bar */}
            <div className="action-bar">
              <div className="action-bar-label">
                <strong>Download PDF</strong>
                {templateId === 1 ? 'Minimal' : templateId === 2 ? 'Modern' : templateId === 3 ? 'Editorial' : 'Data Science'}
              </div>
              <div className="action-bar-right">
                <button className="btn btn-secondary" onClick={handleRegenerate}>
                  ← Edit & Regenerate
                </button>
                <DownloadBtn portfolioData={portfolio} templateId={templateId} orientation={orientation} />
              </div>
            </div>

            {/* Live Preview */}
            <div className="card">
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)'
              }}>
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem' }}>
                    Live Preview
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    This is how your portfolio content looks. The PDF may differ slightly by template.
                  </div>
                </div>
                <span style={{
                  fontSize: '0.75rem', color: 'var(--success)',
                  background: 'rgba(52, 211, 153, 0.1)', border: '1px solid var(--success)',
                  padding: '3px 10px', borderRadius: 20
                }}>
                  ● AI Enhanced
                </span>
              </div>
              <Portfolio portfolio={portfolio} />
            </div>

            {/* Bottom action */}
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <div style={{ marginTop: 12 }}>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.82rem' }}
                  onClick={handleRegenerate}
                >
                  Start Over
                </button>
              </div>
            </div>

          </>
        )}

      </main>
    </div>
  )
}