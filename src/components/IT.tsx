import { useEffect, useState } from 'react'
import { Server, Monitor, Shield, HelpCircle, Plus, CheckCircle2, AlertTriangle } from 'lucide-react'
import Header from './Header'
import { getApiUrl } from '../utils/api'
import './IT.css'

interface ItOverviewApi {
    managedDevices: number
    openTickets: number
}

interface ItDeviceApiRow {
    id: number
    label: string
    owner: string
    type: string
    status: string
}

interface ItTicketApiRow {
    id: number
    title: string
    owner: string
    status: string
    priority: string
}

interface ApiResponse<T> {
    data: T
}

async function fetchItData<T>(path: string, signal: AbortSignal): Promise<T> {
    const response = await fetch(getApiUrl(path), { signal })
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
    }
    const json = (await response.json()) as ApiResponse<T>
    return json.data
}

/**
 * IT Module - Basic IT overview for a small company
 * Focuses on a simple device inventory, support tickets, and system status.
 */
const IT = () => {
    const [activeSection, setActiveSection] = useState<'overview' | 'devices' | 'tickets'>('overview')

    const sections: { id: typeof activeSection; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
        { id: 'overview', label: 'Overview', icon: Server },
        { id: 'devices', label: 'Devices', icon: Monitor },
        { id: 'tickets', label: 'Support Tickets', icon: HelpCircle },
    ]

    return (
        <div className="it-container">
            <Header />
            <div className="it-content">
                <aside className="it-sidebar">
                    <h2 className="it-sidebar-title">IT</h2>
                    <nav className="it-nav">
                        {sections.map((section) => {
                            const Icon = section.icon
                            return (
                                <button
                                    key={section.id}
                                    className={`it-nav-item ${activeSection === section.id ? 'it-nav-active' : ''}`}
                                    onClick={() => setActiveSection(section.id)}
                                >
                                    <Icon size={18} />
                                    <span>{section.label}</span>
                                </button>
                            )
                        })}
                    </nav>
                </aside>

                <main className="it-main">
                    {activeSection === 'overview' && <ItOverviewSection />}
                    {activeSection === 'devices' && <ItDevicesSection />}
                    {activeSection === 'tickets' && <ItTicketsSection />}
                </main>
            </div>
        </div>
    )
}

/**
 * IT Overview - High-level summary for a small team.
 */
const ItOverviewSection = () => {
    const [managedDevices, setManagedDevices] = useState(0)
    const [openTickets, setOpenTickets] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        const load = async () => {
            try {
                setLoading(true)
                setError(null)
                const overview = await fetchItData<ItOverviewApi>('/api/it/overview', controller.signal)
                setManagedDevices(overview.managedDevices)
                setOpenTickets(overview.openTickets)
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    setError('Unable to load IT overview. Please try again later.')
                    console.error('[IT][OVERVIEW][ERROR]', err)
                }
            } finally {
                setLoading(false)
            }
        }
        void load()
        return () => controller.abort()
    }, [])

    return (
        <div className="it-section">
            <div className="it-section-header">
                <div>
                    <h1 className="it-section-title">IT Overview</h1>
                    <p className="it-section-subtitle">
                        Simple IT overview for a small team: devices, access, and support.
                    </p>
                </div>
            </div>

            <div className="it-stats-grid">
                <div className="it-stat-card">
                    <div className="it-stat-label">Managed Devices</div>
                    <div className="it-stat-value">{managedDevices}</div>
                    <div className="it-stat-caption">Laptops, desktops, and monitors</div>
                </div>
                <div className="it-stat-card">
                    <div className="it-stat-label">Open Tickets</div>
                    <div className="it-stat-value">{openTickets}</div>
                    <div className="it-stat-caption">Items needing attention</div>
                </div>
            </div>

            {loading && <div className="it-loading-state">Loading IT overview...</div>}
            {error && !loading && <div className="it-error-state">{error}</div>}

            <div className="it-status-grid">
                <div className="it-status-card">
                    <div className="it-status-header">
                        <Shield size={18} />
                        <span>Access & Security</span>
                    </div>
                    <ul className="it-status-list">
                        <li>All employee accounts protected with strong passwords.</li>
                        <li>Shared Wi‑Fi password stored in the internal wiki only.</li>
                        <li>Admin access restricted to 1–2 people.</li>
                    </ul>
                </div>
                <div className="it-status-card">
                    <div className="it-status-header">
                        <Server size={18} />
                        <span>Core Tools</span>
                    </div>
                    <ul className="it-status-list">
                        <li>Company email (e.g. Google Workspace or Microsoft 365).</li>
                        <li>Shared drive for documents and templates.</li>
                        <li>One primary communication tool (Slack / Teams).</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

/**
 * Simple device inventory for up to ~10 employees.
 */
const ItDevicesSection = () => {
    const [devices, setDevices] = useState<
        { id: number; label: string; owner: string; type: string; status: string }[]
    >([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        const load = async () => {
            try {
                setLoading(true)
                setError(null)
                const rows = await fetchItData<ItDeviceApiRow[]>('/api/it/devices', controller.signal)
                const mapped = rows.map((row) => ({
                    id: row.id,
                    label: row.label,
                    owner: row.owner,
                    type: row.type,
                    status: row.status,
                }))
                setDevices(mapped)
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    setError('Unable to load devices. Please try again later.')
                    console.error('[IT][DEVICES][ERROR]', err)
                }
            } finally {
                setLoading(false)
            }
        }
        void load()
        return () => controller.abort()
    }, [])

    return (
        <div className="it-section">
            <div className="it-section-header">
                <div>
                    <h1 className="it-section-title">Devices</h1>
                    <p className="it-section-subtitle">
                        Lightweight device list for a team smaller than ten people.
                    </p>
                </div>
                <button className="it-btn-secondary" type="button">
                    <Plus size={16} />
                    Add Device (manual)
                </button>
            </div>

            <div className="it-table-container">
                {loading ? (
                    <div className="it-loading-state">Loading devices...</div>
                ) : error ? (
                    <div className="it-error-state">{error}</div>
                ) : (
                    <table className="it-table">
                        <thead>
                            <tr>
                                <th>Label</th>
                                <th>Assigned To</th>
                                <th>Type</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {devices.map((device) => (
                                <tr key={device.id}>
                                    <td className="it-table-name">{device.label}</td>
                                    <td>{device.owner}</td>
                                    <td>{device.type}</td>
                                    <td>
                                        <span
                                            className={`it-status-pill ${
                                                device.status === 'in_use'
                                                    ? 'it-status-pill-green'
                                                    : device.status === 'available'
                                                        ? 'it-status-pill-gray'
                                                        : 'it-status-pill-gray'
                                            }`}
                                        >
                                            {device.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {devices.length === 0 && !loading && !error && (
                                <tr>
                                    <td colSpan={4} className="it-empty-state">
                                        No devices found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

/**
 * Simple manual IT ticket list for a tiny company.
 */
const ItTicketsSection = () => {
    const [tickets, setTickets] = useState<
        { id: number; title: string; owner: string; status: string; priority: string }[]
    >([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [formValues, setFormValues] = useState({
        title: '',
        owner: '',
        status: 'open',
        priority: 'low',
    })

    useEffect(() => {
        const controller = new AbortController()
        const load = async () => {
            try {
                setLoading(true)
                setError(null)
                const rows = await fetchItData<ItTicketApiRow[]>('/api/it/tickets', controller.signal)
                const mapped = rows.map((row) => ({
                    id: row.id,
                    title: row.title,
                    owner: row.owner,
                    status: row.status,
                    priority: row.priority,
                }))
                setTickets(mapped)
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    setError('Unable to load tickets. Please try again later.')
                    console.error('[IT][TICKETS][ERROR]', err)
                }
            } finally {
                setLoading(false)
            }
        }
        void load()
        return () => controller.abort()
    }, [])

    const handleOpenAdd = () => {
        setFormValues({
            title: '',
            owner: '',
            status: 'open',
            priority: 'low',
        })
        setFormError(null)
        setIsAddOpen(true)
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (isSubmitting) return

        const issues: string[] = []
        if (!formValues.title.trim()) issues.push('Title is required')
        if (!formValues.owner.trim()) issues.push('Owner is required')

        if (issues.length > 0) {
            setFormError(issues.join(', '))
            return
        }

        try {
            setIsSubmitting(true)
            setFormError(null)
            const response = await fetch(getApiUrl('/api/it/tickets'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: formValues.title.trim(),
                    owner: formValues.owner.trim(),
                    status: formValues.status,
                    priority: formValues.priority,
                }),
            })

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`)
            }

            const json = (await response.json()) as ApiResponse<ItTicketApiRow>
            const row = json.data
            const mapped = {
                id: row.id,
                title: row.title,
                owner: row.owner,
                status: row.status,
                priority: row.priority,
            }
            setTickets((prev) => [...prev, mapped])
            setIsAddOpen(false)
        } catch (err) {
            console.error('[IT][TICKETS][CREATE][ERROR]', err)
            setFormError('Unable to create ticket. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="it-section">
            <div className="it-section-header">
                <div>
                    <h1 className="it-section-title">Support Tickets</h1>
                    <p className="it-section-subtitle">
                        Simple, manual list of IT tasks. Ideal for tracking just a few items.
                    </p>
                </div>
                <button className="it-btn-primary" type="button" onClick={handleOpenAdd}>
                    <Plus size={16} />
                    New Ticket
                </button>
            </div>

            <div className="it-tickets-list">
                {loading && <div className="it-loading-state">Loading tickets...</div>}
                {error && !loading && <div className="it-error-state">{error}</div>}
                {!loading && !error && tickets.length === 0 && (
                    <div className="it-empty-state">No tickets found.</div>
                )}
                {!loading &&
                    !error &&
                    tickets.map((ticket) => (
                    <div key={ticket.id} className="it-ticket-card">
                        <div className="it-ticket-header">
                            <div>
                                <h3 className="it-ticket-title">
                                    #{ticket.id} · {ticket.title}
                                </h3>
                                <p className="it-ticket-meta">Owner: {ticket.owner}</p>
                            </div>
                            <div className="it-ticket-tags">
                                <span
                                    className={`it-status-pill ${
                                        ticket.status === 'open'
                                            ? 'it-status-pill-orange'
                                            : ticket.status === 'in_progress'
                                                ? 'it-status-pill-blue'
                                                : 'it-status-pill-green'
                                    }`}
                                >
                                    {ticket.status.replace('_', ' ')}
                                </span>
                                <span className="it-status-pill it-status-pill-gray">
                                    {ticket.priority} priority
                                </span>
                            </div>
                        </div>
                        <div className="it-ticket-footer">
                            <div className="it-ticket-indicator">
                                {ticket.status === 'open' || ticket.status === 'in_progress' ? (
                                    <AlertTriangle size={14} />
                                ) : (
                                    <CheckCircle2 size={14} />
                                )}
                                <span>
                                    {ticket.status === 'open'
                                        ? 'Needs attention'
                                        : ticket.status === 'in_progress'
                                            ? 'Being worked on'
                                            : 'Completed'}
                                </span>
                            </div>
                        </div>
                    </div>
                    ))}
            </div>

            {isAddOpen && (
                <div className="it-modal-backdrop">
                    <div className="it-modal">
                        <div className="it-modal-header">
                            <h2 className="it-modal-title">New IT Ticket</h2>
                            <button
                                type="button"
                                className="it-modal-close"
                                onClick={() => !isSubmitting && setIsAddOpen(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form className="it-modal-body" onSubmit={handleSubmit}>
                            <div className="it-modal-grid">
                                <label className="it-field">
                                    <span className="it-field-label">Title</span>
                                    <input
                                        className="it-field-input"
                                        value={formValues.title}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, title: e.target.value }))
                                        }
                                        required
                                    />
                                </label>
                                <label className="it-field">
                                    <span className="it-field-label">Owner</span>
                                    <input
                                        className="it-field-input"
                                        value={formValues.owner}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, owner: e.target.value }))
                                        }
                                        required
                                    />
                                </label>
                                <label className="it-field">
                                    <span className="it-field-label">Status</span>
                                    <select
                                        className="it-field-input"
                                        value={formValues.status}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, status: e.target.value }))
                                        }
                                    >
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </label>
                                <label className="it-field">
                                    <span className="it-field-label">Priority</span>
                                    <select
                                        className="it-field-input"
                                        value={formValues.priority}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, priority: e.target.value }))
                                        }
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </label>
                            </div>
                            {formError && <div className="it-error-state">{formError}</div>}
                            <div className="it-modal-footer">
                                <button
                                    type="button"
                                    className="it-btn-secondary"
                                    onClick={() => !isSubmitting && setIsAddOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="it-btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Save Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default IT


