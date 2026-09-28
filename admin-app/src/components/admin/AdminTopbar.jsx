export default function AdminTopbar({ title }) {
  return (
    <header className="admin-topbar">
      <h1>{title}</h1>
      <div className="admin-topbar-right">
        <span className="admin-topbar-date">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>
    </header>
  )
}
