export default function Loader({ text = "Generating your portfolio...", sub = "AI is crafting your content" }) {
  return (
    <div className="loader-overlay">
      <div className="loader-spinner" />
      <div className="loader-text">{text}</div>
      <div className="loader-sub">{sub}</div>
    </div>
  )
}
