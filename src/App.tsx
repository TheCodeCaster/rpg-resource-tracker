import { useEffect, useState, type FormEvent } from 'react'
import { loadData, saveData } from './storage'
import type { AppData, Category, Tracker } from './types'

const makeId = () => crypto.randomUUID()

export default function App() {
  const [data, setData] = useState<AppData>(loadData)
  const [categoryName, setCategoryName] = useState('')
  const [trackerName, setTrackerName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [currentValue, setCurrentValue] = useState('0')
  const [maxValue, setMaxValue] = useState('10')
  const [error, setError] = useState('')

  useEffect(() => saveData(data), [data])

  function addCategory(event: FormEvent) {
    event.preventDefault()
    const name = categoryName.trim()
    if (!name) return
    if (data.categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
      setError('Category names must be unique.')
      return
    }
    const category: Category = { id: makeId(), name }
    setData((previous) => ({ ...previous, categories: [...previous.categories, category] }))
    setCategoryName('')
    setCategoryId((selected) => selected || category.id)
    setError('')
  }

  function addTracker(event: FormEvent) {
    event.preventDefault()
    const name = trackerName.trim()
    const current = Number(currentValue)
    const max = Number(maxValue)
    if (!name || !categoryId) return setError('Enter a name and select a category.')
    if (!Number.isInteger(current) || !Number.isInteger(max) || max < 1 || current < 0 || current > max) {
      return setError('Values must be whole numbers, with 0 ≤ current ≤ maximum and maximum ≥ 1.')
    }
    const tracker: Tracker = { id: makeId(), name, categoryId, currentValue: current, maxValue: max }
    setData((previous) => ({ ...previous, trackers: [...previous.trackers, tracker] }))
    setTrackerName('')
    setCurrentValue('0')
    setMaxValue('10')
    setError('')
  }

  function changeValue(id: string, delta: number) {
    setData((previous) => ({
      ...previous,
      trackers: previous.trackers.map((tracker) =>
        tracker.id === id
          ? { ...tracker, currentValue: Math.min(tracker.maxValue, Math.max(0, tracker.currentValue + delta)) }
          : tracker,
      ),
    }))
  }

  function removeTracker(id: string) {
    setData((previous) => ({ ...previous, trackers: previous.trackers.filter((tracker) => tracker.id !== id) }))
  }

  function removeCategory(category: Category) {
    const trackerCount = data.trackers.filter((tracker) => tracker.categoryId === category.id).length
    const message = trackerCount
      ? `Delete “${category.name}” and its ${trackerCount} tracker${trackerCount === 1 ? '' : 's'}?`
      : `Delete “${category.name}”?`
    if (!window.confirm(message)) return
    setData((previous) => ({
      categories: previous.categories.filter((item) => item.id !== category.id),
      trackers: previous.trackers.filter((tracker) => tracker.categoryId !== category.id),
    }))
    if (categoryId === category.id) setCategoryId('')
  }

  return (
    <>
      <header>
        <div className="brand-mark">R</div>
        <div><p className="eyebrow">Character companion</p><h1>Resource Tracker</h1></div>
      </header>
      <main>
        <section className="intro">
          <div><p className="eyebrow">At the table</p><h2>Keep every resource in reach.</h2></div>
          <p>Create your own categories, then track health, spell slots, ammunition—or anything your adventure needs.</p>
        </section>

        {error && <div className="error" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss">×</button></div>}

        <div className="layout">
          <aside>
            <section className="panel">
              <div className="section-heading"><h3>Categories</h3><span>{data.categories.length}</span></div>
              <form onSubmit={addCategory} className="inline-form">
                <label className="sr-only" htmlFor="category-name">Category name</label>
                <input id="category-name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="e.g. Combat" maxLength={40} />
                <button className="primary" type="submit">Add</button>
              </form>
              <div className="category-list">
                {data.categories.length === 0 && <p className="muted">Start by adding a category.</p>}
                {data.categories.map((category) => (
                  <div className="category-row" key={category.id}>
                    <span>{category.name}</span>
                    <button className="icon-button" onClick={() => removeCategory(category)} aria-label={`Delete ${category.name}`}>×</button>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <h3>New tracker</h3>
              <form onSubmit={addTracker} className="tracker-form">
                <label>Name<input value={trackerName} onChange={(e) => setTrackerName(e.target.value)} placeholder="e.g. Hit Points" maxLength={60} /></label>
                <label>Category<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={!data.categories.length}>
                  <option value="">Select a category</option>
                  {data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select></label>
                <div className="value-fields">
                  <label>Current<input type="number" min="0" step="1" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} /></label>
                  <label>Maximum<input type="number" min="1" step="1" value={maxValue} onChange={(e) => setMaxValue(e.target.value)} /></label>
                </div>
                <button className="primary wide" type="submit" disabled={!data.categories.length}>Create tracker</button>
              </form>
            </section>
          </aside>

          <section className="trackers" aria-label="Trackers">
            {data.categories.length === 0 ? (
              <div className="empty"><span>✦</span><h3>Your character sheet starts here</h3><p>Add a category to organize your first resource.</p></div>
            ) : data.trackers.length === 0 ? (
              <div className="empty"><span>✦</span><h3>No trackers yet</h3><p>Use the form to create your first tracker.</p></div>
            ) : data.categories.map((category) => {
              const trackers = data.trackers.filter((tracker) => tracker.categoryId === category.id)
              if (!trackers.length) return null
              return <div className="tracker-group" key={category.id}>
                <div className="group-heading"><h3>{category.name}</h3><span>{trackers.length} resource{trackers.length === 1 ? '' : 's'}</span></div>
                <div className="card-grid">{trackers.map((tracker) => (
                  <TrackerCard key={tracker.id} tracker={tracker} onChange={changeValue} onRemove={removeTracker} />
                ))}</div>
              </div>
            })}
          </section>
        </div>
      </main>
      <footer>Stored locally on this device.</footer>
    </>
  )
}

function TrackerCard({ tracker, onChange, onRemove }: { tracker: Tracker; onChange: (id: string, delta: number) => void; onRemove: (id: string) => void }) {
  const percentage = Math.round((tracker.currentValue / tracker.maxValue) * 100)
  return <article className="tracker-card">
    <div className="card-top"><h4>{tracker.name}</h4><button className="icon-button" onClick={() => onRemove(tracker.id)} aria-label={`Delete ${tracker.name}`}>×</button></div>
    <div className="meter" aria-label={`${percentage}% remaining`}><span style={{ width: `${percentage}%` }} /></div>
    <div className="counter">
      <button onClick={() => onChange(tracker.id, -1)} disabled={tracker.currentValue === 0} aria-label={`Decrease ${tracker.name}`}>−</button>
      <div><strong>{tracker.currentValue}</strong><span>/ {tracker.maxValue}</span></div>
      <button onClick={() => onChange(tracker.id, 1)} disabled={tracker.currentValue === tracker.maxValue} aria-label={`Increase ${tracker.name}`}>+</button>
    </div>
  </article>
}
