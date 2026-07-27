import { useRef, useState } from 'react'
import { exportBackup, importBackup } from './backup'
import { CATEGORY_EMOJI, CATEGORY_NAMES, type EditableChore } from './useChores'
import type { useChores } from './useChores'

const LEVELS = [
  { v: 1, label: 'S' },
  { v: 3, label: 'M' },
  { v: 5, label: 'H' },
] as const

const TARGETS = [
  { v: 7, label: 'Daily' },
  { v: 5, label: '5×' },
  { v: 3, label: '3×' },
  { v: 2, label: '2×' },
  { v: 1, label: 'Weekly' },
  { v: 0.5, label: 'Every 2 wks' },
  { v: 0.25, label: 'Monthly' },
  { v: 0.1, label: 'Rarely' },
]

function Dial({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="dial">
      <div className="dial-head">
        <span className="dial-label">{label}</span>
        <span className="dial-hint">{hint}</span>
      </div>
      <div className="segmented" role="group" aria-label={label}>
        {LEVELS.map((l) => (
          <button
            key={l.v}
            className="seg"
            data-on={value === l.v}
            aria-pressed={value === l.v}
            onClick={() => onChange(l.v)}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ChoreEditor({
  chore,
  api,
  onClose,
}: {
  chore: EditableChore
  api: ReturnType<typeof useChores>
  onClose: () => void
}) {
  const [draft, setDraft] = useState(chore)
  const patch = (p: Partial<EditableChore>) => {
    const next = { ...draft, ...p }
    setDraft(next)
    api.save(next)
  }
  const pts = draft.effort + draft.aversion + draft.mentalLoad

  return (
    <div className="editor">
      <div className="editor-top">
        <input
          className="editor-emoji"
          value={draft.emoji}
          placeholder="🙂"
          maxLength={2}
          onChange={(e) => patch({ emoji: e.target.value })}
          aria-label="Emoji"
        />
        <input
          className="editor-name"
          value={draft.name}
          placeholder="What is the chore?"
          onChange={(e) => patch({ name: e.target.value })}
          aria-label="Chore name"
        />
      </div>

      <Dial
        label="Effort"
        hint="physical drain"
        value={draft.effort}
        onChange={(v) => patch({ effort: v })}
      />
      <Dial
        label="Aversion"
        hint="how much you'd pay to avoid it"
        value={draft.aversion}
        onChange={(v) => patch({ aversion: v })}
      />
      <Dial
        label="Mental load"
        hint="does it announce itself, or must you remember?"
        value={draft.mentalLoad}
        onChange={(v) => patch({ mentalLoad: v })}
      />

      <div className="dial">
        <div className="dial-head">
          <span className="dial-label">How often</span>
          <span className="dial-hint">a target, never a judgement</span>
        </div>
        <div className="target-grid">
          {TARGETS.map((t) => (
            <button
              key={t.v}
              className="seg"
              data-on={draft.target === t.v}
              aria-pressed={draft.target === t.v}
              onClick={() => patch({ target: t.v })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="editor-foot">
        <span className="editor-pts">{pts} points each time</span>
        <div className="sync-actions">
          <button className="ghost" onClick={() => api.move(draft.id, -1)} aria-label="Move up">
            ↑
          </button>
          <button className="ghost" onClick={() => api.move(draft.id, 1)} aria-label="Move down">
            ↓
          </button>
          <button className="ghost" onClick={() => api.remove(draft.id).then(onClose)}>
            Delete
          </button>
          <button className="ghost" data-primary="true" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Settings({
  api,
  onClose,
}: {
  api: ReturnType<typeof useChores>
  onClose: () => void
}) {
  const [editing, setEditing] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="settings">
      <header className="settings-head">
        <div>
          <h1 className="settings-title">Chores &amp; scores</h1>
          <p className="settings-sub">
            Change anything here and it changes on both phones — including this
            week&rsquo;s totals, which are recalculated from the current scores.
          </p>
        </div>
        <button className="ghost" onClick={onClose}>
          Done
        </button>
      </header>

      {CATEGORY_NAMES.map((cat) => {
        const list = api.chores
          .filter((c) => c.category === cat)
          .sort((a, b) => a.sortOrder - b.sortOrder)
        return (
          <section className="settings-cat" key={cat}>
            <div className="settings-cat-head">
              <span className="cat-emoji">{CATEGORY_EMOJI[cat]}</span>
              <span className="cat-name">{cat}</span>
            </div>

            {list.map((c) =>
              editing === c.id ? (
                <ChoreEditor key={c.id} chore={c} api={api} onClose={() => setEditing(null)} />
              ) : (
                <div className="set-row" key={c.id} data-off={!c.active}>
                  <button className="set-hit" onClick={() => setEditing(c.id)}>
                    <span className="row-name">
                      {c.emoji && <span className="row-emoji">{c.emoji}</span>}
                      {c.name || 'Untitled chore'}
                    </span>
                    <span className="row-meta">
                      <span className="row-pts">
                        {c.effort + c.aversion + c.mentalLoad} pts
                      </span>
                      <span className="row-target">target {c.target}</span>
                    </span>
                  </button>
                  <button
                    className="toggle"
                    role="switch"
                    aria-checked={c.active}
                    aria-label={`${c.active ? 'Hide' : 'Show'} ${c.name}`}
                    onClick={() => api.setActive(c.id, !c.active)}
                  >
                    <span className="toggle-knob" />
                  </button>
                </div>
              ),
            )}

            <button
              className="add-chore"
              onClick={() => api.add(cat).then((c) => setEditing(c.id))}
            >
              + Add a chore
            </button>
          </section>
        )
      })}

      <section className="settings-cat">
        <div className="settings-cat-head">
          <span className="cat-name">Backup</span>
        </div>
        <p className="footer-note" style={{ marginBottom: 10 }}>
          A single file with every week held on this device and your chore list. Keep one
          before changing anything you would hate to lose.
        </p>
        <div className="sync-actions">
          <button className="ghost" onClick={() => exportBackup(api.chores)}>
            Download backup
          </button>
          <button className="ghost" onClick={() => fileRef.current?.click()}>
            Restore from file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              try {
                const b = await importBackup(f)
                if (b.chores?.length) await api.replaceAll(b.chores)
                setNote('Restored. Reopen the app to see the weeks.')
              } catch (err) {
                setNote(err instanceof Error ? err.message : 'Could not read that file.')
              }
              e.target.value = ''
            }}
          />
        </div>
        {note && <p className="sync-error">{note}</p>}
      </section>

      <footer className="footer">
        <p className="footer-note">
          Hiding a chore keeps everything already logged against it. Deleting does not.
        </p>
        <button
          className="ghost"
          onClick={() => {
            if (confirm('Put every chore and score back to the starting list?')) api.reset()
          }}
        >
          Reset list
        </button>
      </footer>
    </div>
  )
}
