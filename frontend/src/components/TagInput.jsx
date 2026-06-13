import { useState, useRef } from 'react'

export default function TagInput({ tags = [], onChange, placeholder = "Type and press Enter..." }) {
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  const addTag = (value) => {
    const val = value.trim()
    if (val && !tags.includes(val)) {
      onChange([...tags, val])
    }
    setInput('')
  }

  const removeTag = (tag) => onChange(tags.filter(t => t !== tag))

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <>
      <div className="tag-input-wrapper" onClick={() => inputRef.current?.focus()}>
        {tags.map(tag => (
          <span key={tag} className="tag">
            {tag}
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => removeTag(tag)}
            >×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="tag-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => { if (input.trim()) addTag(input) }}
          placeholder={tags.length === 0 ? placeholder : ''}
        />
      </div>
      <div className="tag-hint">Press Enter or comma to add</div>
    </>
  )
}