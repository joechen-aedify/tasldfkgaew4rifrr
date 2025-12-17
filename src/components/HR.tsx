import { useEffect, useState } from 'react'
import { Users, Briefcase, UserPlus, Calendar, Award, Search, Plus, Filter, Download, Edit, Trash2 } from 'lucide-react'
import Header from './Header'
import { getApiUrl } from '../utils/api'
import './HR.css'

interface EmployeeApiRow {
    id: number
    firstName: string
    lastName: string
    email: string
    department: string
    position: string
    status: string
    hiredAt: string
}

interface BenefitApiRow {
    id: number
    name: string
    type: string
    description: string | null
    isActive: number | boolean
}

interface OnboardingApiRow {
    id: number
    employeeId: number
    position: string
    status: string
    startedAt: string | null
    completedAt: string | null
}

interface JobPostingApiRow {
    id: number
    title: string
    department: string
    status: string
    location: string | null
    createdAt: string
    updatedAt: string
}

interface AbsenceApiRow {
    id: number
    employeeId: number
    type: string
    status: string
    startDate: string
    endDate: string
    createdAt: string
    updatedAt: string
}

interface ApiResponse<T> {
    data: T
}

/**
 * Fetch helper for HR module API endpoints with basic error handling
 * and abort support for component unmount.
 */
async function fetchHrData<T>(path: string, signal: AbortSignal): Promise<T> {
    const response = await fetch(getApiUrl(path), { signal })
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
    }
    const json = (await response.json()) as ApiResponse<T>
    return json.data
}

/**
 * HR Module - Main component for Human Resources management
 * Provides access to critical HR functions: Employee Data, Benefits, Onboarding, Recruitment, and Absence Management
 */
const HR = () => {
    const [activeSection, setActiveSection] = useState<string>('employees')

    const sections = [
        { id: 'employees', label: 'Employee Data', icon: Users },
        { id: 'benefits', label: 'Benefits', icon: Award },
        { id: 'onboarding', label: 'Onboarding', icon: UserPlus },
        { id: 'recruitment', label: 'Recruitment', icon: Briefcase },
        { id: 'absence', label: 'Absence Management', icon: Calendar },
    ]

    return (
        <div className="hr-container">
            <Header />
            <div className="hr-content">
                {/* Sidebar Navigation */}
                <aside className="hr-sidebar">
                    <h2 className="hr-sidebar-title">HR Management</h2>
                    <nav className="hr-nav">
                        {sections.map((section) => {
                            const Icon = section.icon
                            return (
                                <button
                                    key={section.id}
                                    className={`hr-nav-item ${activeSection === section.id ? 'hr-nav-active' : ''}`}
                                    onClick={() => setActiveSection(section.id)}
                                >
                                    <Icon size={20} />
                                    <span>{section.label}</span>
                                </button>
                            )
                        })}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="hr-main">
                    {activeSection === 'employees' && <EmployeeDataSection />}
                    {activeSection === 'benefits' && <BenefitsSection />}
                    {activeSection === 'onboarding' && <OnboardingSection />}
                    {activeSection === 'recruitment' && <RecruitmentSection />}
                    {activeSection === 'absence' && <AbsenceManagementSection />}
                </main>
            </div>
        </div>
    )
}

/**
 * Employee Data Section - Manage employee information and records
 */
const EmployeeDataSection = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [employees, setEmployees] = useState<
        {
            id: number
            name: string
            department: string
            position: string
            email: string
            status: string
            joinDate: string
        }[]
    >([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [formValues, setFormValues] = useState({
        firstName: '',
        lastName: '',
        email: '',
        department: '',
        position: '',
        status: 'active',
        hiredAt: '',
    })

    useEffect(() => {
        const controller = new AbortController()
        const load = async () => {
            try {
                setLoading(true)
                setError(null)
                const rows = await fetchHrData<EmployeeApiRow[]>('/api/hr/employees', controller.signal)
                const mapped = rows.map((row) => ({
                    id: row.id,
                    name: `${row.firstName} ${row.lastName}`,
                    department: row.department,
                    position: row.position,
                    email: row.email,
                    status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
                    joinDate: row.hiredAt?.slice(0, 10) ?? '',
                }))
                setEmployees(mapped)
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    setError('Unable to load employees. Please try again later.')
                    console.error('[HR][EMPLOYEES][ERROR]', err)
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
            firstName: '',
            lastName: '',
            email: '',
            department: '',
            position: '',
            status: 'active',
            hiredAt: '',
        })
        setFormError(null)
        setIsAddOpen(true)
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (isSubmitting) return

        const issues: string[] = []
        if (!formValues.firstName.trim()) issues.push('First name is required')
        if (!formValues.lastName.trim()) issues.push('Last name is required')
        if (!formValues.email.trim()) issues.push('Email is required')
        if (!formValues.department.trim()) issues.push('Department is required')
        if (!formValues.position.trim()) issues.push('Position is required')

        if (issues.length > 0) {
            setFormError(issues.join(', '))
            return
        }

        try {
            setIsSubmitting(true)
            setFormError(null)
            const response = await fetch(getApiUrl('/api/hr/employees'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName: formValues.firstName.trim(),
                    lastName: formValues.lastName.trim(),
                    email: formValues.email.trim(),
                    department: formValues.department.trim(),
                    position: formValues.position.trim(),
                    status: formValues.status,
                    hiredAt: formValues.hiredAt || undefined,
                }),
            })

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`)
            }

            const json = (await response.json()) as ApiResponse<EmployeeApiRow>
            const row = json.data
            const mapped = {
                id: row.id,
                name: `${row.firstName} ${row.lastName}`,
                department: row.department,
                position: row.position,
                email: row.email,
                status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
                joinDate: row.hiredAt?.slice(0, 10) ?? '',
            }
            setEmployees((prev) => [...prev, mapped])
            setIsAddOpen(false)
        } catch (err) {
            console.error('[HR][EMPLOYEES][CREATE][ERROR]', err)
            setFormError('Unable to create employee. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="hr-section">
            <div className="hr-section-header">
                <div>
                    <h1 className="hr-section-title">Employee Data</h1>
                    <p className="hr-section-subtitle">Manage employee information and records</p>
                </div>
                <button className="hr-btn-primary" onClick={handleOpenAdd}>
                    <Plus size={18} />
                    Add Employee
                </button>
            </div>

            <div className="hr-section-toolbar">
                <div className="hr-search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="hr-search-input"
                    />
                </div>
                <button className="hr-btn-secondary">
                    <Filter size={18} />
                    Filter
                </button>
                <button className="hr-btn-secondary">
                    <Download size={18} />
                    Export
                </button>
            </div>

            <div className="hr-table-container">
                {loading ? (
                    <div className="hr-loading-state">Loading employees...</div>
                ) : error ? (
                    <div className="hr-error-state">{error}</div>
                ) : (
                    <table className="hr-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Department</th>
                                <th>Position</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Join Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map((employee) => (
                                <tr key={employee.id}>
                                    <td className="hr-table-name">{employee.name}</td>
                                    <td>{employee.department}</td>
                                    <td>{employee.position}</td>
                                    <td>{employee.email}</td>
                                    <td>
                                        <span className={`hr-status-badge hr-status-${employee.status.toLowerCase().replace(' ', '-')}`}>
                                            {employee.status}
                                        </span>
                                    </td>
                                    <td>{employee.joinDate}</td>
                                    <td>
                                        <div className="hr-action-buttons">
                                            <button className="hr-action-btn" title="Edit">
                                                <Edit size={16} />
                                            </button>
                                            <button className="hr-action-btn hr-action-btn-danger" title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredEmployees.length === 0 && !loading && !error && (
                                <tr>
                                    <td colSpan={7} className="hr-empty-state">
                                        No employees found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="hr-stats-grid">
                <div className="hr-stat-card">
                    <div className="hr-stat-value">{employees.length}</div>
                    <div className="hr-stat-label">Total Employees</div>
                </div>
                <div className="hr-stat-card">
                    <div className="hr-stat-value">{employees.filter(e => e.status === 'Active').length}</div>
                    <div className="hr-stat-label">Active Employees</div>
                </div>
                <div className="hr-stat-card">
                    <div className="hr-stat-value">{employees.filter(e => e.status === 'On Leave').length}</div>
                    <div className="hr-stat-label">On Leave</div>
                </div>
            </div>

            {isAddOpen && (
                <div className="hr-modal-backdrop">
                    <div className="hr-modal">
                        <div className="hr-modal-header">
                            <h2 className="hr-modal-title">Add Employee</h2>
                            <button
                                type="button"
                                className="hr-modal-close"
                                onClick={() => !isSubmitting && setIsAddOpen(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form className="hr-modal-body" onSubmit={handleSubmit}>
                            <div className="hr-modal-grid">
                                <label className="hr-field">
                                    <span className="hr-field-label">First Name</span>
                                    <input
                                        className="hr-field-input"
                                        value={formValues.firstName}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, firstName: e.target.value }))
                                        }
                                        required
                                    />
                                </label>
                                <label className="hr-field">
                                    <span className="hr-field-label">Last Name</span>
                                    <input
                                        className="hr-field-input"
                                        value={formValues.lastName}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, lastName: e.target.value }))
                                        }
                                        required
                                    />
                                </label>
                                <label className="hr-field">
                                    <span className="hr-field-label">Email</span>
                                    <input
                                        type="email"
                                        className="hr-field-input"
                                        value={formValues.email}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, email: e.target.value }))
                                        }
                                        required
                                    />
                                </label>
                                <label className="hr-field">
                                    <span className="hr-field-label">Department</span>
                                    <input
                                        className="hr-field-input"
                                        value={formValues.department}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, department: e.target.value }))
                                        }
                                        required
                                    />
                                </label>
                                <label className="hr-field">
                                    <span className="hr-field-label">Position</span>
                                    <input
                                        className="hr-field-input"
                                        value={formValues.position}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, position: e.target.value }))
                                        }
                                        required
                                    />
                                </label>
                                <label className="hr-field">
                                    <span className="hr-field-label">Status</span>
                                    <select
                                        className="hr-field-input"
                                        value={formValues.status}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, status: e.target.value }))
                                        }
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="terminated">Terminated</option>
                                        <option value="on_leave">On Leave</option>
                                    </select>
                                </label>
                                <label className="hr-field">
                                    <span className="hr-field-label">Hire Date</span>
                                    <input
                                        type="date"
                                        className="hr-field-input"
                                        value={formValues.hiredAt}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, hiredAt: e.target.value }))
                                        }
                                    />
                                </label>
                            </div>
                            {formError && <div className="hr-error-state hr-modal-error">{formError}</div>}
                            <div className="hr-modal-footer">
                                <button
                                    type="button"
                                    className="hr-btn-secondary"
                                    onClick={() => !isSubmitting && setIsAddOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="hr-btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Save Employee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

/**
 * Benefits Section - Manage employee benefits and compensation
 */
const BenefitsSection = () => {
    const [benefits, setBenefits] = useState<
        {
            id: number
            name: string
            type: string
            coverage: string
            employees: number | null
            cost: string | null
        }[]
    >([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [formValues, setFormValues] = useState({
        name: '',
        type: '',
        description: '',
        isActive: true,
    })

    useEffect(() => {
        const controller = new AbortController()
        const load = async () => {
            try {
                setLoading(true)
                setError(null)
                const rows = await fetchHrData<BenefitApiRow[]>('/api/hr/benefits', controller.signal)
                const mapped = rows.map((row) => ({
                    id: row.id,
                    name: row.name,
                    type: row.type,
                    coverage: row.description ?? 'N/A',
                    employees: null,
                    cost: row.isActive ? 'Active' : 'Inactive',
                }))
                setBenefits(mapped)
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    setError('Unable to load benefits. Please try again later.')
                    console.error('[HR][BENEFITS][ERROR]', err)
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
            name: '',
            type: '',
            description: '',
            isActive: true,
        })
        setFormError(null)
        setIsAddOpen(true)
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (isSubmitting) return

        const issues: string[] = []
        if (!formValues.name.trim()) issues.push('Name is required')
        if (!formValues.type.trim()) issues.push('Type is required')
        if (issues.length > 0) {
            setFormError(issues.join(', '))
            return
        }

        try {
            setIsSubmitting(true)
            setFormError(null)
            const response = await fetch(getApiUrl('/api/hr/benefits'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formValues.name.trim(),
                    type: formValues.type.trim(),
                    description: formValues.description || null,
                    isActive: formValues.isActive,
                }),
            })

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`)
            }

            const json = (await response.json()) as ApiResponse<BenefitApiRow>
            const row = json.data
            const mapped = {
                id: row.id,
                name: row.name,
                type: row.type,
                coverage: row.description ?? 'N/A',
                employees: null,
                cost: row.isActive ? 'Active' : 'Inactive',
            }
            setBenefits((prev) => [...prev, mapped])
            setIsAddOpen(false)
        } catch (err) {
            console.error('[HR][BENEFITS][CREATE][ERROR]', err)
            setFormError('Unable to create benefit. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="hr-section">
            <div className="hr-section-header">
                <div>
                    <h1 className="hr-section-title">Benefits Management</h1>
                    <p className="hr-section-subtitle">Manage employee benefits and compensation packages</p>
                </div>
                <button className="hr-btn-primary" onClick={handleOpenAdd}>
                    <Plus size={18} />
                    Add Benefit
                </button>
            </div>

            <div className="hr-benefits-grid">
                {loading && <div className="hr-loading-state">Loading benefits...</div>}
                {error && !loading && <div className="hr-error-state">{error}</div>}
                {!loading && !error && benefits.length === 0 && (
                    <div className="hr-empty-state">No benefits configured.</div>
                )}
                {!loading &&
                    !error &&
                    benefits.map((benefit) => (
                        <div key={benefit.id} className="hr-benefit-card">
                            <div className="hr-benefit-header">
                                <h3 className="hr-benefit-name">{benefit.name}</h3>
                                <span className="hr-benefit-type">{benefit.type}</span>
                            </div>
                            <div className="hr-benefit-details">
                                <div className="hr-benefit-detail">
                                    <span className="hr-benefit-label">Coverage / Description:</span>
                                    <span className="hr-benefit-value">{benefit.coverage}</span>
                                </div>
                                <div className="hr-benefit-detail">
                                    <span className="hr-benefit-label">Status:</span>
                                    <span className="hr-benefit-value">{benefit.cost}</span>
                                </div>
                            </div>
                            <div className="hr-benefit-actions">
                                <button className="hr-btn-secondary">Manage</button>
                                <button className="hr-action-btn">
                                    <Edit size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
            </div>

            {isAddOpen && (
                <div className="hr-modal-backdrop">
                    <div className="hr-modal">
                        <div className="hr-modal-header">
                            <h2 className="hr-modal-title">Add Benefit</h2>
                            <button
                                type="button"
                                className="hr-modal-close"
                                onClick={() => !isSubmitting && setIsAddOpen(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form className="hr-modal-body" onSubmit={handleSubmit}>
                            <div className="hr-modal-grid">
                                <label className="hr-field">
                                    <span className="hr-field-label">Name</span>
                                    <input
                                        className="hr-field-input"
                                        value={formValues.name}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, name: e.target.value }))
                                        }
                                        required
                                    />
                                </label>
                                <label className="hr-field">
                                    <span className="hr-field-label">Type</span>
                                    <input
                                        className="hr-field-input"
                                        value={formValues.type}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, type: e.target.value }))
                                        }
                                        required
                                    />
                                </label>
                                <label className="hr-field">
                                    <span className="hr-field-label">Description</span>
                                    <input
                                        className="hr-field-input"
                                        value={formValues.description}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({
                                                ...prev,
                                                description: e.target.value,
                                            }))
                                        }
                                        placeholder="Short description or coverage details"
                                    />
                                </label>
                                <label className="hr-field">
                                    <span className="hr-field-label">Status</span>
                                    <select
                                        className="hr-field-input"
                                        value={formValues.isActive ? 'active' : 'inactive'}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({
                                                ...prev,
                                                isActive: e.target.value === 'active',
                                            }))
                                        }
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </label>
                            </div>
                            {formError && <div className="hr-error-state hr-modal-error">{formError}</div>}
                            <div className="hr-modal-footer">
                                <button
                                    type="button"
                                    className="hr-btn-secondary"
                                    onClick={() => !isSubmitting && setIsAddOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="hr-btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Save Benefit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

/**
 * Onboarding Section - Manage new employee onboarding process
 */
const OnboardingSection = () => {
    const [onboardingTasks, setOnboardingTasks] = useState<
        {
            id: number
            employee: string
            position: string
            startDate: string
            status: string
            progress: number
        }[]
    >([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [formValues, setFormValues] = useState({
        employeeId: '',
        position: '',
        status: 'not_started',
        startedAt: '',
    })

    useEffect(() => {
        const controller = new AbortController()
        const load = async () => {
            try {
                setLoading(true)
                setError(null)
                const rows = await fetchHrData<OnboardingApiRow[]>('/api/hr/onboarding', controller.signal)
                const mapped = rows.map((row) => ({
                    id: row.id,
                    employee: `Employee #${row.employeeId}`,
                    position: row.position,
                    startDate: row.startedAt?.slice(0, 10) ?? 'Not started',
                    status:
                        row.status === 'completed'
                            ? 'Completed'
                            : row.status === 'in_progress'
                                ? 'In Progress'
                                : row.status === 'not_started'
                                    ? 'Pending'
                                    : row.status,
                    // Simple heuristic: completed = 100, not_started = 0, in_progress = 50, blocked = 25
                    progress:
                        row.status === 'completed'
                            ? 100
                            : row.status === 'not_started'
                                ? 0
                                : row.status === 'in_progress'
                                    ? 50
                                    : 25,
                }))
                setOnboardingTasks(mapped)
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    setError('Unable to load onboarding data. Please try again later.')
                    console.error('[HR][ONBOARDING][ERROR]', err)
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
            employeeId: '',
            position: '',
            status: 'not_started',
            startedAt: '',
        })
        setFormError(null)
        setIsAddOpen(true)
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (isSubmitting) return

        const issues: string[] = []
        if (!formValues.employeeId.trim() || Number.isNaN(Number(formValues.employeeId))) {
            issues.push('Valid employee ID is required')
        }
        if (!formValues.position.trim()) issues.push('Position is required')

        if (issues.length > 0) {
            setFormError(issues.join(', '))
            return
        }

        try {
            setIsSubmitting(true)
            setFormError(null)
            const response = await fetch(getApiUrl('/api/hr/onboarding'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    employeeId: Number(formValues.employeeId),
                    position: formValues.position.trim(),
                    status: formValues.status,
                    startedAt: formValues.startedAt || null,
                }),
            })

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`)
            }

            const json = (await response.json()) as ApiResponse<OnboardingApiRow>
            const row = json.data
            const mapped = {
                id: row.id,
                employee: `Employee #${row.employeeId}`,
                position: row.position,
                startDate: row.startedAt?.slice(0, 10) ?? 'Not started',
                status:
                    row.status === 'completed'
                        ? 'Completed'
                        : row.status === 'in_progress'
                            ? 'In Progress'
                            : row.status === 'not_started'
                                ? 'Pending'
                                : row.status,
                progress:
                    row.status === 'completed'
                        ? 100
                        : row.status === 'not_started'
                            ? 0
                            : row.status === 'in_progress'
                                ? 50
                                : 25,
            }
            setOnboardingTasks((prev) => [...prev, mapped])
            setIsAddOpen(false)
        } catch (err) {
            console.error('[HR][ONBOARDING][CREATE][ERROR]', err)
            setFormError('Unable to create onboarding flow. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'var(--accent-green)'
            case 'In Progress': return 'var(--accent-orange)'
            case 'Pending': return 'var(--text-secondary)'
            default: return 'var(--text-secondary)'
        }
    }

    return (
        <div className="hr-section">
            <div className="hr-section-header">
                <div>
                    <h1 className="hr-section-title">Onboarding</h1>
                    <p className="hr-section-subtitle">Track and manage new employee onboarding process</p>
                </div>
                <button className="hr-btn-primary" onClick={handleOpenAdd}>
                    <Plus size={18} />
                    New Onboarding
                </button>
            </div>

            <div className="hr-onboarding-list">
                {loading && <div className="hr-loading-state">Loading onboarding data...</div>}
                {error && !loading && <div className="hr-error-state">{error}</div>}
                {!loading && !error && onboardingTasks.length === 0 && (
                    <div className="hr-empty-state">No onboarding flows found.</div>
                )}
                {!loading &&
                    !error &&
                    onboardingTasks.map((task) => (
                        <div key={task.id} className="hr-onboarding-card">
                            <div className="hr-onboarding-header">
                                <div>
                                    <h3 className="hr-onboarding-name">{task.employee}</h3>
                                    <p className="hr-onboarding-position">{task.position}</p>
                                </div>
                                <span
                                    className="hr-status-badge"
                                    style={{ backgroundColor: getStatusColor(task.status) + '20', color: getStatusColor(task.status) }}
                                >
                                    {task.status}
                                </span>
                            </div>
                            <div className="hr-onboarding-info">
                                <div className="hr-onboarding-info-item">
                                    <span className="hr-onboarding-label">Start Date:</span>
                                    <span className="hr-onboarding-value">{task.startDate}</span>
                                </div>
                                <div className="hr-onboarding-progress">
                                    <div className="hr-onboarding-progress-header">
                                        <span className="hr-onboarding-label">Progress</span>
                                        <span className="hr-onboarding-progress-value">{task.progress}%</span>
                                    </div>
                                    <div className="hr-progress-bar">
                                        <div
                                            className="hr-progress-fill"
                                            style={{ width: `${task.progress}%`, backgroundColor: getStatusColor(task.status) }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="hr-onboarding-actions">
                                <button className="hr-btn-secondary">View Details</button>
                                <button className="hr-action-btn">
                                    <Edit size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
            </div>

            {isAddOpen && (
                <div className="hr-modal-backdrop">
                    <div className="hr-modal">
                        <div className="hr-modal-header">
                            <h2 className="hr-modal-title">New Onboarding</h2>
                            <button
                                type="button"
                                className="hr-modal-close"
                                onClick={() => !isSubmitting && setIsAddOpen(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form className="hr-modal-body" onSubmit={handleSubmit}>
                            <div className="hr-modal-grid">
                                <label className="hr-field">
                                    <span className="hr-field-label">Employee ID</span>
                                    <input
                                        className="hr-field-input"
                                        value={formValues.employeeId}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, employeeId: e.target.value }))
                                        }
                                        required
                                    />
                                </label>
                                <label className="hr-field">
                                    <span className="hr-field-label">Position</span>
                                    <input
                                        className="hr-field-input"
                                        value={formValues.position}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, position: e.target.value }))
                                        }
                                        required
                                    />
                                </label>
                                <label className="hr-field">
                                    <span className="hr-field-label">Status</span>
                                    <select
                                        className="hr-field-input"
                                        value={formValues.status}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, status: e.target.value }))
                                        }
                                    >
                                        <option value="not_started">Not Started</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="blocked">Blocked</option>
                                    </select>
                                </label>
                                <label className="hr-field">
                                    <span className="hr-field-label">Start Date</span>
                                    <input
                                        type="date"
                                        className="hr-field-input"
                                        value={formValues.startedAt}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, startedAt: e.target.value }))
                                        }
                                    />
                                </label>
                            </div>
                            {formError && <div className="hr-error-state hr-modal-error">{formError}</div>}
                            <div className="hr-modal-footer">
                                <button
                                    type="button"
                                    className="hr-btn-secondary"
                                    onClick={() => !isSubmitting && setIsAddOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="hr-btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Save Onboarding'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

/**
 * Recruitment Section - Manage job postings and candidate pipeline
 */
const RecruitmentSection = () => {
    const [jobPostings, setJobPostings] = useState<
        { id: number; title: string; department: string; applicants: number | null; status: string; postedDate: string }[]
    >([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [formValues, setFormValues] = useState({
        title: '',
        department: '',
        status: 'draft',
        location: '',
    })

    useEffect(() => {
        const controller = new AbortController()
        const load = async () => {
            try {
                setLoading(true)
                setError(null)
                const rows = await fetchHrData<JobPostingApiRow[]>('/api/hr/recruitment', controller.signal)
                const mapped = rows.map((row) => ({
                    id: row.id,
                    title: row.title,
                    department: row.department,
                    applicants: null,
                    status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
                    postedDate: row.createdAt.slice(0, 10),
                }))
                setJobPostings(mapped)
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    setError('Unable to load job postings. Please try again later.')
                    console.error('[HR][RECRUITMENT][ERROR]', err)
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
            department: '',
            status: 'draft',
            location: '',
        })
        setFormError(null)
        setIsAddOpen(true)
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (isSubmitting) return

        const issues: string[] = []
        if (!formValues.title.trim()) issues.push('Title is required')
        if (!formValues.department.trim()) issues.push('Department is required')

        if (issues.length > 0) {
            setFormError(issues.join(', '))
            return
        }

        try {
            setIsSubmitting(true)
            setFormError(null)
            const response = await fetch(getApiUrl('/api/hr/recruitment'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: formValues.title.trim(),
                    department: formValues.department.trim(),
                    status: formValues.status,
                    location: formValues.location || null,
                }),
            })

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`)
            }

            const json = (await response.json()) as ApiResponse<JobPostingApiRow>
            const row = json.data
            const mapped = {
                id: row.id,
                title: row.title,
                department: row.department,
                applicants: null,
                status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
                postedDate: row.createdAt.slice(0, 10),
            }
            setJobPostings((prev) => [...prev, mapped])
            setIsAddOpen(false)
        } catch (err) {
            console.error('[HR][RECRUITMENT][CREATE][ERROR]', err)
            setFormError('Unable to create job posting. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="hr-section">
            <div className="hr-section-header">
                <div>
                    <h1 className="hr-section-title">Recruitment</h1>
                    <p className="hr-section-subtitle">Manage job postings and candidate pipeline</p>
                </div>
                <button className="hr-btn-primary" onClick={handleOpenAdd}>
                    <Plus size={18} />
                    Post New Job
                </button>
            </div>

            <div className="hr-recruitment-content">
                <div className="hr-recruitment-section">
                    <h2 className="hr-subsection-title">Active Job Postings</h2>
                    <div className="hr-job-list">
                        {loading && <div className="hr-loading-state">Loading job postings...</div>}
                        {error && !loading && <div className="hr-error-state">{error}</div>}
                        {!loading && !error && jobPostings.length === 0 && (
                            <div className="hr-empty-state">No job postings found.</div>
                        )}
                        {!loading &&
                            !error &&
                            jobPostings.map((job) => (
                                <div key={job.id} className="hr-job-card">
                                    <div className="hr-job-header">
                                        <div>
                                            <h3 className="hr-job-title">{job.title}</h3>
                                            <p className="hr-job-department">{job.department}</p>
                                        </div>
                                        <span className={`hr-status-badge hr-status-${job.status.toLowerCase()}`}>
                                            {job.status}
                                        </span>
                                    </div>
                                    <div className="hr-job-stats">
                                        <div className="hr-job-stat">
                                            <span className="hr-job-stat-label">Applicants:</span>
                                            <span className="hr-job-stat-value">
                                                {job.applicants !== null ? job.applicants : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="hr-job-stat">
                                            <span className="hr-job-stat-label">Posted:</span>
                                            <span className="hr-job-stat-value">{job.postedDate}</span>
                                        </div>
                                    </div>
                                    <div className="hr-job-actions">
                                        <button className="hr-btn-secondary">View Applicants</button>
                                        <button className="hr-action-btn">
                                            <Edit size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Candidate pipeline is still using UI-only mock data for now.
                    It can be wired to a dedicated backend endpoint in a later iteration. */}
            </div>

            {isAddOpen && (
                <div className="hr-modal-backdrop">
                    <div className="hr-modal">
                        <div className="hr-modal-header">
                            <h2 className="hr-modal-title">Post New Job</h2>
                            <button
                                type="button"
                                className="hr-modal-close"
                                onClick={() => !isSubmitting && setIsAddOpen(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form className="hr-modal-body" onSubmit={handleSubmit}>
                            <div className="hr-modal-grid">
                                <label className="hr-field">
                                    <span className="hr-field-label">Job Title</span>
                                    <input
                                        className="hr-field-input"
                                        value={formValues.title}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, title: e.target.value }))
                                        }
                                        required
                                    />
                                </label>
                                <label className="hr-field">
                                    <span className="hr-field-label">Department</span>
                                    <input
                                        className="hr-field-input"
                                        value={formValues.department}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, department: e.target.value }))
                                        }
                                        required
                                    />
                                </label>
                                <label className="hr-field">
                                    <span className="hr-field-label">Status</span>
                                    <select
                                        className="hr-field-input"
                                        value={formValues.status}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, status: e.target.value }))
                                        }
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="active">Active</option>
                                        <option value="closed">Closed</option>
                                        <option value="on_hold">On Hold</option>
                                    </select>
                                </label>
                                <label className="hr-field">
                                    <span className="hr-field-label">Location</span>
                                    <input
                                        className="hr-field-input"
                                        value={formValues.location}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, location: e.target.value }))
                                        }
                                        placeholder="e.g. San Francisco, Remote"
                                    />
                                </label>
                            </div>
                            {formError && <div className="hr-error-state hr-modal-error">{formError}</div>}
                            <div className="hr-modal-footer">
                                <button
                                    type="button"
                                    className="hr-btn-secondary"
                                    onClick={() => !isSubmitting && setIsAddOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="hr-btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Post Job'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

/**
 * Absence Management Section - Track employee leave and time off
 */
const AbsenceManagementSection = () => {
    const [absences, setAbsences] = useState<
        { id: number; employee: string; type: string; startDate: string; endDate: string; days: number; status: string }[]
    >([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [formValues, setFormValues] = useState({
        employeeId: '',
        type: 'vacation',
        status: 'requested',
        startDate: '',
        endDate: '',
    })

    useEffect(() => {
        const controller = new AbortController()
        const load = async () => {
            try {
                setLoading(true)
                setError(null)
                const rows = await fetchHrData<AbsenceApiRow[]>('/api/hr/absences', controller.signal)
                const mapped = rows.map((row) => {
                    const start = new Date(row.startDate)
                    const end = new Date(row.endDate)
                    const diffMs = end.getTime() - start.getTime()
                    const days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1)

                    return {
                        id: row.id,
                        employee: `Employee #${row.employeeId}`,
                        type: row.type.charAt(0).toUpperCase() + row.type.slice(1),
                        startDate: row.startDate.slice(0, 10),
                        endDate: row.endDate.slice(0, 10),
                        days,
                        status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
                    }
                })
                setAbsences(mapped)
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    setError('Unable to load absences. Please try again later.')
                    console.error('[HR][ABSENCES][ERROR]', err)
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
            employeeId: '',
            type: 'vacation',
            status: 'requested',
            startDate: '',
            endDate: '',
        })
        setFormError(null)
        setIsAddOpen(true)
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (isSubmitting) return

        const issues: string[] = []
        if (!formValues.employeeId.trim() || Number.isNaN(Number(formValues.employeeId))) {
            issues.push('Valid employee ID is required')
        }
        if (!formValues.startDate) issues.push('Start date is required')
        if (!formValues.endDate) issues.push('End date is required')

        if (issues.length > 0) {
            setFormError(issues.join(', '))
            return
        }

        try {
            setIsSubmitting(true)
            setFormError(null)
            const response = await fetch(getApiUrl('/api/hr/absences'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    employeeId: Number(formValues.employeeId),
                    type: formValues.type,
                    status: formValues.status,
                    startDate: formValues.startDate,
                    endDate: formValues.endDate,
                }),
            })

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`)
            }

            const json = (await response.json()) as ApiResponse<AbsenceApiRow>
            const row = json.data
            const start = new Date(row.startDate)
            const end = new Date(row.endDate)
            const diffMs = end.getTime() - start.getTime()
            const days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1)
            const mapped = {
                id: row.id,
                employee: `Employee #${row.employeeId}`,
                type: row.type.charAt(0).toUpperCase() + row.type.slice(1),
                startDate: row.startDate.slice(0, 10),
                endDate: row.endDate.slice(0, 10),
                days,
                status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
            }
            setAbsences((prev) => [...prev, mapped])
            setIsAddOpen(false)
        } catch (err) {
            console.error('[HR][ABSENCES][CREATE][ERROR]', err)
            setFormError('Unable to create absence record. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const leaveBalances = [
        { type: 'Vacation Days', total: 20, used: 8, remaining: 12 },
        { type: 'Sick Days', total: 10, used: 3, remaining: 7 },
        { type: 'Personal Days', total: 5, used: 1, remaining: 4 },
    ]

    return (
        <div className="hr-section">
            <div className="hr-section-header">
                <div>
                    <h1 className="hr-section-title">Absence Management</h1>
                    <p className="hr-section-subtitle">Track and manage employee leave requests</p>
                </div>
                <button className="hr-btn-primary" onClick={handleOpenAdd}>
                    <Plus size={18} />
                    New Request
                </button>
            </div>

            <div className="hr-absence-content">
                <div className="hr-leave-balances">
                    <h2 className="hr-subsection-title">Leave Balances Overview</h2>
                    <div className="hr-balance-grid">
                        {leaveBalances.map((balance, index) => (
                            <div key={index} className="hr-balance-card">
                                <h3 className="hr-balance-type">{balance.type}</h3>
                                <div className="hr-balance-stats">
                                    <div className="hr-balance-stat">
                                        <span className="hr-balance-label">Total:</span>
                                        <span className="hr-balance-value">{balance.total}</span>
                                    </div>
                                    <div className="hr-balance-stat">
                                        <span className="hr-balance-label">Used:</span>
                                        <span className="hr-balance-value">{balance.used}</span>
                                    </div>
                                    <div className="hr-balance-stat">
                                        <span className="hr-balance-label">Remaining:</span>
                                        <span className="hr-balance-value hr-balance-remaining">{balance.remaining}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hr-absence-list-section">
                    <h2 className="hr-subsection-title">Recent Leave Requests</h2>
                    <div className="hr-absence-list">
                        {loading && <div className="hr-loading-state">Loading absences...</div>}
                        {error && !loading && <div className="hr-error-state">{error}</div>}
                        {!loading && !error && absences.length === 0 && (
                            <div className="hr-empty-state">No absences recorded.</div>
                        )}
                        {!loading &&
                            !error &&
                            absences.map((absence) => (
                                <div key={absence.id} className="hr-absence-card">
                                    <div className="hr-absence-header">
                                        <div>
                                            <h3 className="hr-absence-employee">{absence.employee}</h3>
                                            <p className="hr-absence-type">{absence.type}</p>
                                        </div>
                                        <span className={`hr-status-badge hr-status-${absence.status.toLowerCase()}`}>
                                            {absence.status}
                                        </span>
                                    </div>
                                    <div className="hr-absence-details">
                                        <div className="hr-absence-detail">
                                            <span className="hr-absence-label">Period:</span>
                                            <span className="hr-absence-value">
                                                {absence.startDate} - {absence.endDate}
                                            </span>
                                        </div>
                                        <div className="hr-absence-detail">
                                            <span className="hr-absence-label">Duration:</span>
                                            <span className="hr-absence-value">{absence.days} day(s)</span>
                                        </div>
                                    </div>
                                    <div className="hr-absence-actions">
                                        {absence.status === 'Pending' && (
                                            <>
                                                <button className="hr-btn-success">Approve</button>
                                                <button className="hr-btn-danger">Reject</button>
                                            </>
                                        )}
                                        <button className="hr-action-btn">
                                            <Edit size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {isAddOpen && (
                <div className="hr-modal-backdrop">
                    <div className="hr-modal">
                        <div className="hr-modal-header">
                            <h2 className="hr-modal-title">New Leave Request</h2>
                            <button
                                type="button"
                                className="hr-modal-close"
                                onClick={() => !isSubmitting && setIsAddOpen(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form className="hr-modal-body" onSubmit={handleSubmit}>
                            <div className="hr-modal-grid">
                                <label className="hr-field">
                                    <span className="hr-field-label">Employee ID</span>
                                    <input
                                        className="hr-field-input"
                                        value={formValues.employeeId}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, employeeId: e.target.value }))
                                        }
                                        required
                                    />
                                </label>
                                <label className="hr-field">
                                    <span className="hr-field-label">Type</span>
                                    <select
                                        className="hr-field-input"
                                        value={formValues.type}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, type: e.target.value }))
                                        }
                                    >
                                        <option value="vacation">Vacation</option>
                                        <option value="sick">Sick</option>
                                        <option value="unpaid">Unpaid</option>
                                        <option value="other">Other</option>
                                    </select>
                                </label>
                                <label className="hr-field">
                                    <span className="hr-field-label">Status</span>
                                    <select
                                        className="hr-field-input"
                                        value={formValues.status}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, status: e.target.value }))
                                        }
                                    >
                                        <option value="requested">Requested</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </label>
                                <label className="hr-field">
                                    <span className="hr-field-label">Start Date</span>
                                    <input
                                        type="date"
                                        className="hr-field-input"
                                        value={formValues.startDate}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, startDate: e.target.value }))
                                        }
                                        required
                                    />
                                </label>
                                <label className="hr-field">
                                    <span className="hr-field-label">End Date</span>
                                    <input
                                        type="date"
                                        className="hr-field-input"
                                        value={formValues.endDate}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({ ...prev, endDate: e.target.value }))
                                        }
                                        required
                                    />
                                </label>
                            </div>
                            {formError && <div className="hr-error-state hr-modal-error">{formError}</div>}
                            <div className="hr-modal-footer">
                                <button
                                    type="button"
                                    className="hr-btn-secondary"
                                    onClick={() => !isSubmitting && setIsAddOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="hr-btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Save Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default HR

