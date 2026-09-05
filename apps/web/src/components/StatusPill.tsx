export function StatusPill({ active, children }: { active: boolean; children: string }) { return <span className={`status-pill ${active ? 'active' : 'muted'}`}><i />{children}</span> }
