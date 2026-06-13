import { useState } from 'react'
import axios from 'axios'

export default function DownloadBtn({ portfolioData, templateId, orientation = 'portrait' }) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  const handleDownload = async () => {
    if (!templateId) {
      setError('Please select a template above before downloading.')
      return
    }

    if (!portfolioData) {
      setError('Generate portfolio first.')
      return
    }

    setError('')
    setDownloading(true)

    try {
      const res = await axios.post(
        'https://ai-portfolio-maker-mark-1.onrender.com/api/download-pdf',
        {
          portfolio_data: portfolioData,
          template_id: templateId,
          orientation
        },
        {
          responseType: 'blob'
        }
      )

      const blob = new Blob([res.data], { type: 'application/pdf' })

      if (blob.size < 1000) {
        throw new Error('Invalid PDF received')
      }

      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url

      const safeName = portfolioData?.full_name
        ? portfolioData.full_name.replace(/\s+/g, '_')
        : 'portfolio'

      link.download = `${safeName}_Portfolio_${orientation}.pdf`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)

    } catch (err) {
      console.error(err)
      setError('Failed to generate PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="error-banner" style={{ marginBottom: 10 }}>
          ⚠ {error}
        </div>
      )}

      <button
        className="btn btn-success"
        onClick={handleDownload}
        disabled={downloading}
      >
        {downloading ? (
          <>
            <span
              style={{
                width: 12,
                height: 12,
                border: '2px solid rgba(255,255,255,0.2)',
                borderTopColor: 'var(--success)',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.6s linear infinite',
                marginRight: 6
              }}
            />
            Generating...
          </>
        ) : (
          <>⬇ Download PDF</>
        )}
      </button>
    </div>
  )
}