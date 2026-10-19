'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, Building2, Check, ChevronDown, ClipboardList, FileText, FolderOpen, LayoutDashboard, Menu, Plus, Search, Wallet, Users, X, Download, Eye, Upload, Settings, Home, Bell, CheckCircle2, MapPin, Mail, ArrowLeft, Pencil, Trash2, ExternalLink, HardHat, Phone, MessageCircle, Sparkles, Filter, RefreshCw, Send, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { demoProjects, demoEntries, demoEnquiries, money, paise, quotationTotal, canSeeRecord, canWrite, type Project, type Entry, type Enquiry } from '../lib/core';

const date = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
const labels: Record<string, string> = { quotation: "Quotations & Estimates", agreement: "Agreements", expense: "Materials & Expenses", labour: "Labour & Attendance", payment: "Client Payments", update: "Site Updates" };
const emptySettings = { name: "Mahendra Real Estate", location: 'Kota, Rajasthan', phone: '919829012345', about: 'Delivering end-to-end architectural design, structural excellence, and premium construction for custom homes and residential communities across Rajasthan.' };
const initials = (s: string) => (s || 'MR').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();

function Logo({ name = "Mahendra Real Estate" }: { name?: string }) {
  return (
    <span className="logo">
      <span className="brand-icon"><Building2 size={23} /></span>
      <span className="brand-name">
        {name === "Mahendra Real Estate" ? <><span>Mahendra</span><small>REAL ESTATE</small></> : name}
      </span>
      <span className="logo-dot">.</span>
    </span>
  );
}

const displayValue = (v: string) => ({
  'In progress': 'In Progress',
  'Completed': 'Completed',
  'On hold': 'On Hold',
  'Draft': 'Draft',
  'Signed copy filed': 'Signed Copy Filed',
  'Independent home': 'Independent Home',
  'Housing society': 'Residential Society',
  'Materials': 'Materials',
  'Transport': 'Transport',
  'Equipment': 'Equipment',
  'Other expense': 'Other Expense'
} as Record<string, string>)[v] || v;

function Tag({ children, tone = '' }: { children: React.ReactNode; tone?: string }) {
  return <span className={'tag ' + tone}>{typeof children === 'string' ? displayValue(children) : children}</span>;
}

export default function App() {
  const [view, setView] = useState<'public' | 'workspace'>('public');
  const [tab, setTab] = useState('overview');
  const [demo, setDemo] = useState(true);
  const [role, setRole] = useState('contractor');
  const [projects, setProjects] = useState<Project[]>(demoProjects);
  const [records, setRecords] = useState<Entry[]>(demoEntries);
  const [files, setFiles] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>(demoEnquiries);
  const [enquiryFilter, setEnquiryFilter] = useState('all');
  const [audit, setAudit] = useState<any[]>([]);
  const [settings, setSettings] = useState(emptySettings);
  const [publicProjects, setPublicProjects] = useState<any[] | null>(null);
  const [publicSettings, setPublicSettings] = useState<any>(null);
  const [selected, setSelected] = useState('all');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<any>(null);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [printEntry, setPrintEntry] = useState<Entry | null>(null);
  const [error, setError] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function notify(s: string) {
    setToast(s);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 5000);
  }

  useEffect(() => {
    fetch('/api/portfolio')
      .then(r => r.json())
      .then((d: any) => {
        if (d.settings) {
          setPublicSettings({ ...d.settings, name: d.settings.name === 'Nirmaan' ? 'Mahendra Real Estate' : d.settings.name });
          setPublicProjects(d.projects);
        }
      })
      .catch(() => {});

    if (new URLSearchParams(location.search).get('workspace')) {
      void openLive();
    }
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function apply(d: any) {
    setRole(d.role);
    setProjects(d.projects || []);
    setRecords(d.records || []);
    setFiles(d.files || []);
    setMembers(d.members || []);
    setEnquiries(d.enquiries && d.enquiries.length ? d.enquiries : demoEnquiries);
    setAudit(d.audit || []);
    setSettings({ ...emptySettings, ...d.settings, name: !d.settings?.name || d.settings.name === 'Nirmaan' ? 'Mahendra Real Estate' : d.settings.name });
  }

  async function openLive(emailToAuth?: string) {
    setBusy(true);
    setError('');
    try {
      if (emailToAuth) {
        const authRes = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login', email: emailToAuth })
        });
        const authData: any = await authRes.json();
        if (!authRes.ok) throw new Error(authData.error || 'Authentication failed');
      }
      const r = await fetch('/api/workspace');
      if (r.status === 401) {
        setModal({ type: 'auth' });
        return;
      }
      const d: any = await r.json();
      if (!r.ok) throw new Error(d.error);
      setDemo(false);
      setSelected('all');
      apply(d);
      setView('workspace');
      setTab('overview');
      if (d.role === 'uninitialized') setModal({ type: 'initialize' });
      notify("Connected to Live Workspace");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function openDemo() {
    setDemo(true);
    setRole('contractor');
    setProjects(demoProjects);
    setRecords(demoEntries);
    setEnquiries(demoEnquiries);
    setSettings(emptySettings);
    setFiles([]);
    setMembers([]);
    setAudit([]);
    setSelected('all');
    setView('workspace');
    setTab('overview');
  }

  async function signOut() {
    setBusy(true);
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      });
    } catch {}
    setDemo(true);
    setView('public');
    notify("Signed out successfully");
    setBusy(false);
  }

  async function mutate(body: any) {
    if (demo) {
      if (body.action === 'project') {
        if (body.data.isPublic && body.data.status !== 'Completed') throw new Error("Only completed projects can be displayed in the public portfolio.");
        const p = { ...body.data, id: body.data.id || crypto.randomUUID() };
        setProjects(old => old.some(x => x.id === p.id) ? old.map(x => x.id === p.id ? p : x) : [...old, p]);
      }
      if (body.action === 'record') {
        const e = { id: body.id || crypto.randomUUID(), projectId: body.projectId, kind: body.kind, data: body.data, createdAt: new Date().toISOString() };
        setRecords(old => old.some(x => x.id === e.id) ? old.map(x => x.id === e.id ? e : x) : [e, ...old]);
      }
      if (body.action === 'deleteRecord') setRecords(old => old.filter(x => x.id !== body.id));
      if (body.action === 'updateEnquiry') {
        setEnquiries(old => old.map(e => e.id === body.id ? { ...e, ...body.data } : e));
        notify("Inquiry status updated");
        return;
      }
      if (body.action === 'deleteEnquiry') {
        setEnquiries(old => old.filter(e => e.id !== body.id));
        notify("Inquiry removed");
        return;
      }
      if (body.action === 'member') setMembers(old => [...old.filter(x => x.email !== body.data.email), body.data]);
      if (body.action === 'removeMember') setMembers(old => old.filter(x => x.email !== body.email));
      if (body.action === 'settings') setSettings(body.data);
      notify("Sample updated · Changes stored in memory");
      return;
    }

    const r = await fetch('/api/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const d: any = await r.json();
    if (!r.ok) throw new Error(d.error);
    apply(d);
    if (['settings', 'project', 'initialize'].includes(body.action)) {
      try {
        const response = await fetch('/api/portfolio');
        if (!response.ok) throw new Error('Portfolio refresh failed');
        const p: any = await response.json();
        if (p.settings) {
          setPublicSettings({ ...p.settings, name: p.settings.name === 'Nirmaan' ? 'Mahendra Real Estate' : p.settings.name });
          setPublicProjects(p.projects);
        }
      } catch {
        notify("Saved successfully. Please reload the page to refresh portfolio.");
        return;
      }
    }
    notify("Saved to your workspace");
  }

  const visibleProjects = demo && role !== 'contractor' ? projects.filter(p => p.id === 'sample-1') : projects;
  const filteredProjects = visibleProjects.filter(p => (selected === 'all' || p.id === selected) && `${p.name} ${p.location} ${p.client}`.toLowerCase().includes(query.toLowerCase()));
  const visibleRecords = records.filter(r => visibleProjects.some(p => p.id === r.projectId) && canSeeRecord(role, r));
  const currentRecords = visibleRecords.filter(r => (selected === 'all' || r.projectId === selected) && `${r.data.title} ${r.data.supplier || ''}`.toLowerCase().includes(query.toLowerCase()));
  const projectName = (id: string) => projects.find(p => p.id === id)?.name || 'Project';
  const sum = (kind: string, key: string) => currentRecords.filter(r => r.kind === kind).reduce((a, r) => a + (r.data[key] || 0), 0);
  const due = sum('payment', 'amount') - sum('payment', 'paid');

  const filteredEnquiries = enquiries.filter(e => {
    const status = e.status || 'New';
    const matchesFilter = enquiryFilter === 'all' || status === enquiryFilter;
    const matchesQuery = query === '' || `${e.name} ${e.phone} ${e.city} ${e.type} ${e.details}`.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });
  const newEnquiriesCount = enquiries.filter(e => !e.status || e.status === 'New').length;

  function addRecord(kind: string) {
    if (!visibleProjects.length) {
      notify("Please add a project first.");
      return;
    }
    setError('');
    setModal({ type: 'record', kind, projectId: selected !== 'all' ? selected : visibleProjects[0].id });
  }

  function print(r: Entry) {
    setPrintEntry(r);
    setTimeout(() => window.print(), 150);
  }

  const nav = [
    { id: 'overview', label: "Overview", icon: LayoutDashboard },
    { id: 'projects', label: "Projects", icon: Building2 },
    ...(role === 'contractor' ? [{ id: 'enquiries', label: "Website Queries", icon: Mail }] : []),
    { id: 'quotation', label: "Quotations & Estimates", icon: ClipboardList },
    { id: 'agreement', label: "Agreements", icon: FileText },
    ...(role === 'client' ? [] : [
      { id: 'expense', label: "Materials & Expenses", icon: FolderOpen },
      { id: 'labour', label: "Labour & Attendance", icon: HardHat }
    ]),
    { id: 'payment', label: "Client Payments", icon: Wallet },
    { id: 'update', label: "Site Updates", icon: CheckCircle2 },
    { id: 'documents', label: "Documents", icon: FolderOpen },
    ...(role === 'contractor' ? [
      { id: 'team', label: "Team & Access", icon: Users },
      { id: 'audit', label: 'Record History', icon: ClipboardList },
      { id: 'settings', label: "Company Settings", icon: Settings }
    ] : [])
  ];

  const brand = publicSettings || emptySettings;
  const showcase = publicProjects === null ? demoProjects : publicProjects;

  return (
    <>
      <div className="screen">
        {view === 'public' ? (
          <>
            <div className="announcement">
              {publicSettings ? "Custom Homes · Residential Societies · Turnkey Construction" : "LIVE SHOWCASE · High-Performance Construction Portal"}
            </div>
            <header className="public-nav">
              <a href="#" aria-label="Home"><Logo name={brand.name} /></a>
              <nav>
                <a href="#work">Our Work</a>
                <a href="#services">What We Build</a>
                <a href="#process">Our Process</a>
                <a href="#contact">Contact</a>
              </nav>
              <div className="nav-actions">
                <button className="btn outline small" onClick={() => openLive()} title="Open Contractor & Client Dashboard">
                  <LayoutDashboard size={14} /> Admin Portal
                </button>
                <a className="btn dark small" href="#contact">
                  Discuss Project <ArrowUpRight size={15} />
                </a>
              </div>
            </header>

            <main>
              <section className="hero">
                <div className="hero-top">
                  <div>
                    <div className="eyebrow"><span /> CRAFTED FOR FAMILIES</div>
                    <h1>Your Dream Home.<br /><span>Built to Perfection.</span></h1>
                  </div>
                  <div className="hero-copy">
                    <p>From initial blueprints to the key handover.<br />Whether an independent residence or a residential society,<br />experience complete clarity, transparent budgeting, and dedicated supervision at every step.</p>
                    <a className="under-link" href="#work">Explore Our Work <ArrowDown /></a>
                  </div>
                </div>
                <div className="hero-photo">
                  <img fetchPriority="high" src="/house.jpg" alt="Contemporary home with landscaped outdoor spaces" />
                  <div className="photo-shade" />
                  <div className="photo-caption">
                    <div>
                      <span>BUILT FOR EVERYDAY LIVING</span>
                      <h2>Where Comfort Meets Quality.</h2>
                    </div>
                    <a href="#contact" className="round-link" aria-label="Discuss your project"><ArrowUpRight /></a>
                  </div>
                  <span className="photo-label">Architectural rendering · Sample representation</span>
                </div>
                <div className="hero-strip">
                  <span><Check size={16} /> Clear Inclusions & Pricing</span>
                  <span><Check size={16} /> Structured Stage Planning</span>
                  <span><Check size={16} /> Centralized Project Records</span>
                  <span><Check size={16} /> Real-Time Site Updates</span>
                </div>
              </section>

              <section id="work" className="section work">
                <div className="section-head">
                  <div>
                    <div className="eyebrow">01 / PORTFOLIO</div>
                    <h2>Thoughtfully Designed Residences.<br />Engineered for Generations.</h2>
                  </div>
                  <p>{publicProjects === null ? "Completed projects will appear here once published. The showcase below displays sample projects and architectural references." : "Explore our completed custom homes and residential society developments."}</p>
                </div>
                <div className="project-gallery">
                  {showcase.length ? showcase.map((p, i) => (
                    <button key={p.id} className={'gallery-card ' + (i === 0 ? 'wide' : '')} onClick={() => setModal({ type: 'portfolio', project: p })}>
                      <div className="gallery-image">
                        <img loading="lazy" src={p.image} alt={p.name} />
                        <span className="gallery-tag">{publicProjects === null ? "SAMPLE PROJECT" : p.type}</span>
                        <span className="gallery-arrow"><ArrowUpRight size={24} /></span>
                      </div>
                      <div className="gallery-info">
                        <div>
                          <h3>{p.name}</h3>
                          <p>{p.location} <span> / </span> {p.area}</p>
                        </div>
                        <span className="tiny">{displayValue(p.type)}</span>
                      </div>
                    </button>
                  )) : (
                    <div className="empty">Completed projects will appear here once added and marked for portfolio display.</div>
                  )}
                </div>
              </section>

              <section id="services" className="services section">
                <div>
                  <div className="eyebrow">02 / WHAT WE BUILD</div>
                  <h2>One Dedicated Team.<br />From Groundwork to Handover.</h2>
                  <p>{brand.about || <>Every decision, architectural detail, and<br />daily construction milestone executed with precision.</>}</p>
                </div>
                <div className="service-list">
                  {[
                    ['01', 'Independent Custom Homes', "Tailored to your plot, family requirements, and lifestyle with premium finishes and structural integrity."],
                    ['02', 'Residential Societies', "Organized development and turn-key construction for multi-home communities and gated townships."],
                    ['03', "End-to-End Construction", "Comprehensive project management: architecture, material sourcing, structural execution, finishing, and handover."]
                  ].map(([n, t, d]) => (
                    <div key={n}>
                      <span>{n}</span>
                      <div>
                        <h3>{t}</h3>
                        <p>{d}</p>
                      </div>
                      <ArrowUpRight size={21} />
                    </div>
                  ))}
                </div>
              </section>

              <section id="process" className="section process">
                <div className="section-head">
                  <div>
                    <div className="eyebrow">03 / OUR METHODOLOGY</div>
                    <h2>A Straightforward, Transparent Process.</h2>
                  </div>
                  <p>Eliminating guesswork and delays.<br />Track every milestone in one centralized portal.</p>
                </div>
                <div className="steps">
                  {[
                    ['01', "Consultation & Planning", "Share your location, plot dimensions, requirements, and target budget."],
                    ['02', "Estimate & Agreement", "Itemized estimates, detailed specifications, clear timelines, and milestone schedules."],
                    ['03', "Execution & Updates", "Follow live construction progress, material logs, and shared updates in your client portal."],
                    ['04', "Inspection & Handover", "Thorough quality inspection, handover of keys, and permanent archiving of all warranties and documentation."]
                  ].map(([n, t, d]) => (
                    <article key={n}>
                      <span>{n}</span>
                      <h3>{t}</h3>
                      <p>{d}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="workspace-promo">
                <div>
                  <span className="eyebrow">SEAMLESS PROJECT MANAGEMENT</span>
                  <h2>Every Detail.<br />All in One Place.</h2>
                  <p>Quotations, site updates, architectural drawings, and payment tracking.<br />A unified portal keeping homeowners, contractors, and site supervisors in sync.</p>
                  <button className="btn light" onClick={openDemo}>
                    Explore Management Workspace <ArrowUpRight size={17} />
                  </button>
                </div>
                <div className="mini-board">
                  <div className="mini-top">
                    <span className="mini-dot" /> PROJECT SNAPSHOT <span>Live Preview</span>
                  </div>
                  <h3>The Courtyard House</h3>
                  <p>Masonry & Internal Plaster</p>
                  <div className="mini-progress"><span style={{ width: '68%' }} /></div>
                  <div className="mini-bottom">
                    <b>68% <small>completed</small></b>
                    <Tag>In progress</Tag>
                  </div>
                  <div className="mini-task">
                    <CheckCircle2 size={20} />
                    <span>Latest site log<small>Ground floor brickwork & lintel casting complete</small></span>
                    <ArrowUpRight size={16} />
                  </div>
                  <div className="mini-task">
                    <FileText size={20} />
                    <span>Project documents<small>Itemized estimate, agreement, and payment receipts</small></span>
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              </section>

              <section id="contact" className="section contact">
                <div>
                  <div className="eyebrow">START A CONVERSATION</div>
                  <h2>Your Land. Your Vision.<br /><span>Let's Build It Together.</span></h2>
                  <p>Tell us about your upcoming project or construction requirements. Our team responds within 24 hours.</p>
                  {brand.location && <p className="location"><MapPin size={16} />{brand.location}</p>}
                  {brand.phone && (
                    <a className="under-link" href={'https://wa.me/' + brand.phone.replace(/\D/g, '')} target="_blank" rel="noopener noreferrer">
                      Chat with us on WhatsApp <ArrowUpRight size={17} />
                    </a>
                  )}
                </div>
                <form
                  className="contact-form"
                  onSubmit={async e => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const values = Object.fromEntries(new FormData(form)) as any;
                    setBusy(true);
                    try {
                      const r = await fetch('/api/portfolio', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(values)
                      });
                      const d: any = await r.json();
                      if (!r.ok) throw new Error(d.error);

                      // Prepend enquiry to local state so admin sees it in real time
                      const newEnquiry: Enquiry = {
                        id: 'enq-' + Date.now(),
                        name: values.name,
                        phone: values.phone,
                        city: values.city,
                        type: values.type,
                        details: values.details || '',
                        status: 'New',
                        createdAt: new Date().toISOString()
                      };
                      setEnquiries(old => [newEnquiry, ...old]);

                      notify("Inquiry sent successfully! You can view it in the Admin Workspace under Queries.");
                      form.reset();
                    } catch (err) {
                      notify((err as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <div className="form-two">
                    <Field label="Your Name" name="name" required placeholder="Full Name" />
                    <Field label="Mobile Number" name="phone" type="tel" required pattern="\+?[0-9\s-]{10,16}" placeholder="+91 98765 43210" />
                  </div>
                  <div className="form-two">
                    <Field label="City / Project Location" name="city" required placeholder="e.g. Kota, Rajasthan" />
                    <label>
                      Project Type
                      <select name="type">
                        <option value="Independent home">{displayValue("Independent home")}</option>
                        <option value="Housing society">{displayValue("Housing society")}</option>
                        <option value="Renovation & Expansion">Renovation & Expansion</option>
                        <option value="Commercial / Other">Commercial / Other</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    Project Details
                    <textarea name="details" placeholder="Plot dimensions, proposed built-up area, estimated budget, or specific requirements…" rows={4} maxLength={3000} />
                  </label>
                  <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                  <button className="btn dark" disabled={busy}>
                    {busy ? "Sending…" : "Send Inquiry"} <ArrowUpRight size={18} />
                  </button>
                  <p className="fine">Your contact details are shared confidentially with our construction team for project consultation only.</p>
                </form>
              </section>
            </main>

            <footer>
              <Logo name={brand.name} />
              <p>Building your dream home with integrity, precision, and engineering excellence.</p>
              <button className="text-btn" onClick={() => openLive()}>
                Admin Portal <ArrowUpRight size={15} />
              </button>
            </footer>
          </>
        ) : (
          <div className="app-shell">
            {/* Click-away backdrop for mobile drawer */}
            <div className={`sidebar-backdrop ${mobile ? 'open' : ''}`} onClick={() => setMobile(false)} />

            <aside className={'sidebar ' + (mobile ? 'open' : '')}>
              <div className="sidebar-mobile-close">
                <Logo name={settings.name} />
                <button className="icon-btn" onClick={() => setMobile(false)} aria-label="Close navigation">
                  <X size={20} />
                </button>
              </div>
              <button className="brand-button" onClick={() => setView('public')}>
                <Logo name={settings.name} />
              </button>
              <div className="workspace-label">MANAGEMENT WORKSPACE</div>
              <nav>
                {nav.map(n => (
                  <button
                    key={n.id}
                    className={tab === n.id ? 'active' : ''}
                    onClick={() => {
                      setTab(n.id);
                      setQuery('');
                      setMobile(false);
                    }}
                  >
                    <n.icon size={18} />
                    {n.label}
                    {n.id === 'enquiries' && enquiries.length > 0 && (
                      <small style={{
                        background: newEnquiriesCount > 0 ? '#267b40' : '#e4ebdb',
                        color: newEnquiriesCount > 0 ? '#ffffff' : 'inherit',
                        fontWeight: 700
                      }}>
                        {enquiries.length}
                      </small>
                    )}
                  </button>
                ))}
              </nav>
              <div className="sidebar-bottom">
                <button onClick={() => setView('public')}>
                  <ExternalLink size={17} /> View Public Site
                </button>
                <div className="profile">
                  <span>{initials(settings.name)}</span>
                  <div>
                    <strong>{role === 'uninitialized' ? "Get Started" : role[0].toUpperCase() + role.slice(1)}</strong>
                    <small>{demo ? "Sample Workspace" : "Live Workspace"}</small>
                  </div>
                </div>
              </div>
            </aside>

            <div className="app-main">
              <header className="app-header">
                <div>
                  <button className="mobile-toggle" aria-label="Toggle navigation" onClick={() => setMobile(!mobile)}>
                    <Menu />
                  </button>
                  <span>Workspace</span>
                  <span className="slash">/</span>
                  <strong>{nav.find(n => n.id === tab)?.label}</strong>
                </div>
                <div style={{ gap: '12px' }}>
                  <button className="icon-btn" title="View website queries" onClick={() => setTab('enquiries')}>
                    <Mail size={18} />
                  </button>
                  <button className="icon-btn" title="View pending payments" onClick={() => setTab('payment')}>
                    <Bell size={18} />
                  </button>
                  <span className="avatar">{initials(settings.name)}</span>
                </div>
              </header>

              <div className={'mode-banner ' + (!demo ? 'live' : '')}>
                <span>
                  {demo ? (
                    <><span className="status-dot" /> Preview Mode · Interactive in-memory storage</>
                  ) : (
                    <><span className="status-dot" /> Live Production Mode · Secure PostgreSQL & Supabase connected</>
                  )}
                </span>
                {demo ? (
                  <div>
                    <label className="role-select">
                      Role{" "}
                      <select aria-label="Preview role" value={role} onChange={e => { setRole(e.target.value); setTab('overview'); setSelected('all'); }}>
                        <option value="contractor">Contractor (Admin)</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="client">Client</option>
                      </select>
                    </label>
                    <button onClick={() => setModal({ type: 'auth' })}>
                      Switch to Live <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <button onClick={signOut} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 600 }}>
                    Sign Out
                  </button>
                )}
              </div>

              <main className="dashboard">
                <div className="dash-title">
                  <div>
                    <div className="eyebrow">{new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</div>
                    <h1>{tab === 'overview' ? "Everything at a Glance." : nav.find(n => n.id === tab)?.label}</h1>
                    <p>
                      {tab === 'overview' ? "Construction sites, incoming website leads, and financial accounts in one unified admin portal." :
                       tab === 'projects' ? "From foundation to handover, complete tracking and portfolio publishing for every build." :
                       tab === 'enquiries' ? "Live customer leads received from your website contact form with direct WhatsApp and conversion actions." :
                       tab === 'team' ? "Role-based access control scoped strictly to assigned projects." :
                       tab === 'documents' ? "Blueprints, invoices, agreements, and site photos stored securely in the cloud." :
                       tab === 'settings' ? "Update company branding, contact number, and public website profile." :
                       "Keep project records organized, verified, and accessible."}
                    </p>
                  </div>

                  {role === 'contractor' && (tab === 'overview' || tab === 'projects') && (
                    <button className="btn dark" onClick={() => { setError(''); setModal({ type: 'project' }); }}>
                      <Plus size={17} /> New Project
                    </button>
                  )}
                  {labels[tab] && canWrite(role, tab) && (
                    <button className="btn dark" onClick={() => addRecord(tab)}>
                      <Plus size={17} /> Add {tab === 'labour' ? 'Labour Log' : tab === 'expense' ? 'Expense' : labels[tab].slice(0, -1)}
                    </button>
                  )}
                  {tab === 'team' && (
                    <button className="btn dark" onClick={() => setModal({ type: 'member' })}>
                      <Plus size={17} /> Grant Access
                    </button>
                  )}
                  {tab === 'documents' && role !== 'client' && (
                    <button className="btn dark" onClick={() => visibleProjects.length ? setModal({ type: 'upload' }) : notify("Please add a project first.")}>
                      <Upload size={17} /> Upload Document
                    </button>
                  )}
                </div>

                {role === 'uninitialized' && (
                  <div className="setup-callout">
                    <Building2 />
                    <div>
                      <h3>Let's set up your business workspace.</h3>
                      <p>Your workspace starts fresh. Add your company profile and first project to begin.</p>
                    </div>
                    <button className="btn dark" onClick={() => setModal({ type: 'initialize' })}>
                      Set Up Workspace
                    </button>
                  </div>
                )}

                {/* Filter and search bar for projects and general tabs */}
                {!['team', 'enquiries', 'settings', 'audit'].includes(tab) && (
                  <div className="filter-bar">
                    <label>
                      <FolderOpen size={17} />
                      <select aria-label="Filter projects" value={selected} onChange={e => setSelected(e.target.value)}>
                        <option value="all">All Projects ({visibleProjects.length})</option>
                        {visibleProjects.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}
                      </select>
                    </label>
                    <div className="search-box">
                      <Search size={16} />
                      <input aria-label="Search records" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search projects or records…" />
                    </div>
                    <span className="filter-caption">{visibleProjects.length} {visibleProjects.length === 1 ? 'project' : 'projects'}</span>
                  </div>
                )}

                {/* TAB: OVERVIEW */}
                {tab === 'overview' && (
                  <>
                    {/* Admin Quick Toolbar */}
                    <div className="admin-quick-bar">
                      {role === 'contractor' && (
                        <button className="admin-quick-btn" onClick={() => { setError(''); setModal({ type: 'project' }); }}>
                          <Plus size={15} /> Start New Project
                        </button>
                      )}
                      {role === 'contractor' && (
                        <button className="admin-quick-btn" onClick={() => setTab('enquiries')}>
                          <Mail size={15} /> Website Queries {newEnquiriesCount > 0 && <span className="tag" style={{ background: '#257a3e', color: '#fff', fontSize: '9px', padding: '2px 7px', borderRadius: '10px' }}>{newEnquiriesCount} New</span>}
                        </button>
                      )}
                      {canWrite(role, 'payment') && (
                        <button className="admin-quick-btn" onClick={() => addRecord('payment')}>
                          <Wallet size={15} /> Log Client Payment
                        </button>
                      )}
                      {canWrite(role, 'quotation') && (
                        <button className="admin-quick-btn" onClick={() => addRecord('quotation')}>
                          <ClipboardList size={15} /> Create Estimate
                        </button>
                      )}
                      {canWrite(role, 'update') && (
                        <button className="admin-quick-btn" onClick={() => addRecord('update')}>
                          <CheckCircle2 size={15} /> Post Site Update
                        </button>
                      )}
                      {role !== 'client' && (
                        <button className="admin-quick-btn" onClick={() => setModal({ type: 'upload' })}>
                          <Upload size={15} /> Upload Drawing / Bill
                        </button>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div className="stats">
                      <Stat label="Active Projects" value={String(filteredProjects.filter(p => p.status === 'In progress').length)} foot="Sites under active execution" icon={<Building2 />} />
                      {role === 'contractor' && (
                        <Stat label="Website Inquiries" value={String(enquiries.length)} foot={newEnquiriesCount > 0 ? `${newEnquiriesCount} new query waiting` : "All queries reviewed"} icon={<Mail />} />
                      )}
                      <Stat label="Client Dues" value={money(due)} foot="Outstanding instalment balance" icon={<Wallet />} />
                      {role !== 'client' && (
                        <>
                          <Stat label="Material Expenses" value={money(sum('expense', 'amount'))} foot="Cumulative material bills" icon={<FolderOpen />} />
                          <Stat label="Labour Balance" value={money(sum('labour', 'amount') - sum('labour', 'advance') - sum('labour', 'paid'))} foot="Net payable worker wages" icon={<Users />} />
                        </>
                      )}
                    </div>

                    {/* Website Leads Highlight Widget */}
                    {role === 'contractor' && enquiries.length > 0 && (
                      <div className="overview-inquiries-box">
                        <div className="overview-inquiries-head">
                          <h2><Mail size={17} style={{ color: '#2b5a37' }} /> Incoming Website Inquiries ({enquiries.length})</h2>
                          <button className="text-btn" onClick={() => setTab('enquiries')}>
                            Manage All Inquiries <ArrowRight size={14} />
                          </button>
                        </div>
                        <div className="overview-inquiries-list">
                          {enquiries.slice(0, 3).map(e => {
                            const cleanPhone = e.phone.replace(/[^\d+]/g, '');
                            const waText = encodeURIComponent(`Namaste ${e.name}, thank you for reaching out to ${settings.name} regarding your ${e.type} project in ${e.city}.`);
                            return (
                              <div key={e.id} className="overview-inquiry-item">
                                <div className="overview-inquiry-item-top">
                                  <strong>{e.name}</strong>
                                  <Tag>{e.type}</Tag>
                                </div>
                                <p>{e.details || "Inquiry received via website form."}</p>
                                <div className="overview-inquiry-item-foot">
                                  <span style={{ fontSize: '10px', color: '#8b9683' }}>
                                    <MapPin size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /> {e.city}
                                  </span>
                                  <a
                                    className="btn-lead-whatsapp"
                                    style={{ padding: '5px 11px', fontSize: '10px' }}
                                    href={`https://wa.me/${cleanPhone.replace('+', '')}?text=${waText}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <MessageCircle size={13} /> WhatsApp
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Projects Status */}
                    <div className="panel">
                      <div className="panel-head">
                        <div>
                          <h2>Active Construction Projects</h2>
                          <p>Current progress and stages across all sites.</p>
                        </div>
                        <button className="text-btn" onClick={() => setTab('projects')}>
                          View All Projects <ArrowRight size={16} />
                        </button>
                      </div>
                      <div className="dash-projects">
                        {filteredProjects.map(p => (
                          <ProjectCard key={p.id} p={p} onClick={() => { setSelected(p.id); setTab('projects'); }} />
                        ))}
                        {!filteredProjects.length && <Empty text="No projects found. Add your first project to get started." />}
                      </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="overview-bottom">
                      <div className="panel">
                        <div className="panel-head">
                          <h2>Recent Site & Financial Activity</h2>
                          <Tag>{demo ? "Sample Feed" : "Live"}</Tag>
                        </div>
                        {currentRecords.slice(0, 6).map(r => (
                          <button key={r.id} className="activity" onClick={() => setModal({ type: 'detail', entry: r })}>
                            <span className="activity-icon">
                              {r.kind === 'payment' ? <Wallet size={18} /> : r.kind === 'labour' ? <HardHat size={18} /> : <FileText size={18} />}
                            </span>
                            <div>
                              <strong>{r.data.title}</strong>
                              <small>{projectName(r.projectId)} · {labels[r.kind]}</small>
                            </div>
                            <ArrowUpRight size={16} />
                          </button>
                        ))}
                        {!currentRecords.length && <Empty text="Recent site and financial logs will appear here." />}
                      </div>

                      <div className="panel next-panel">
                        <div className="panel-head">
                          <h2>Operations Focus</h2>
                          <span className="status-dot" />
                        </div>
                        <h3>Less Paperwork.<br />More Focus on Quality.</h3>
                        <p>{role === 'client' ? "Your documents, agreements, and verified payment schedules are organized in one place." : "Log daily entries to maintain airtight documentation and prevent billing disputes."}</p>
                        <div className="quick-actions">
                          <button onClick={() => role === 'client' ? setTab('documents') : addRecord('update')}>
                            <Plus size={16} />{role === 'client' ? "View Documents" : "Post Site Log"}
                          </button>
                          <button onClick={() => role === 'client' ? setTab('payment') : addRecord(role === 'supervisor' ? 'expense' : 'quotation')}>
                            <FileText size={16} />{role === 'client' ? "View Payments" : role === 'supervisor' ? "Log Expense" : "Create Quotation"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* TAB: WEBSITE ENQUIRIES / QUERIES CRM */}
                {tab === 'enquiries' && (
                  <div className="enquiries-container">
                    <div className="enquiry-top-stats">
                      <div className="enquiry-stat-card">
                        <div>
                          <span>Total Inquiries Received</span>
                          <strong>{enquiries.length}</strong>
                        </div>
                        <div className="enquiry-stat-icon"><Mail size={20} /></div>
                      </div>
                      <div className="enquiry-stat-card">
                        <div>
                          <span>New / Action Required</span>
                          <strong style={{ color: '#1b6b38' }}>{newEnquiriesCount}</strong>
                        </div>
                        <div className="enquiry-stat-icon new-badge"><Sparkles size={20} /></div>
                      </div>
                      <div className="enquiry-stat-card">
                        <div>
                          <span>In Discussion / Site Visit</span>
                          <strong>{enquiries.filter(e => ['Contacted', 'Site Visit Scheduled'].includes(e.status || '')).length}</strong>
                        </div>
                        <div className="enquiry-stat-icon"><Clock size={20} /></div>
                      </div>
                      <div className="enquiry-stat-card">
                        <div>
                          <span>Converted to Projects</span>
                          <strong style={{ color: '#115729' }}>{enquiries.filter(e => e.status === 'Converted to Project').length}</strong>
                        </div>
                        <div className="enquiry-stat-icon"><CheckCircle2 size={20} /></div>
                      </div>
                    </div>

                    <div className="enquiry-controls-bar">
                      <div className="enquiry-filter-tabs">
                        {[
                          { id: 'all', label: 'All Leads', count: enquiries.length },
                          { id: 'New', label: 'New', count: newEnquiriesCount },
                          { id: 'Contacted', label: 'Contacted', count: enquiries.filter(e => e.status === 'Contacted').length },
                          { id: 'Site Visit Scheduled', label: 'Site Visit', count: enquiries.filter(e => e.status === 'Site Visit Scheduled').length },
                          { id: 'Converted to Project', label: 'Converted', count: enquiries.filter(e => e.status === 'Converted to Project').length },
                          { id: 'Closed', label: 'Closed', count: enquiries.filter(e => e.status === 'Closed').length },
                        ].map(f => (
                          <button
                            key={f.id}
                            className={`enquiry-tab-btn ${enquiryFilter === f.id ? 'active' : ''}`}
                            onClick={() => setEnquiryFilter(f.id)}
                          >
                            {f.label}
                            <small>{f.count}</small>
                          </button>
                        ))}
                      </div>
                      <div className="search-box">
                        <Search size={15} />
                        <input
                          placeholder="Search leads by name, phone, city..."
                          value={query}
                          onChange={e => setQuery(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="enquiries-cards-grid">
                      {filteredEnquiries.map(e => {
                        const status = e.status || 'New';
                        const cleanPhone = e.phone.replace(/[^\d+]/g, '');
                        const waText = encodeURIComponent(`Namaste ${e.name}, thank you for contacting ${settings.name} regarding your ${e.type} project in ${e.city}. When would be a convenient time to discuss your construction requirements?`);
                        return (
                          <div key={e.id} className={`lead-card ${status === 'New' ? 'status-new' : ''}`}>
                            <div className="lead-card-head">
                              <div className="lead-client-info">
                                <div className="lead-avatar">{initials(e.name)}</div>
                                <div className="lead-name-box">
                                  <h3>{e.name}</h3>
                                  <div className="lead-time">
                                    <Clock size={11} />
                                    {new Date(e.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                              <div className={`lead-status-pill status-${status.replace(/\s+/g, '-')}`}>
                                {status}
                              </div>
                            </div>

                            <div className="lead-meta-row">
                              <Tag>{e.type}</Tag>
                              <span><MapPin size={13} /> {e.city}</span>
                              <span><Phone size={13} /> {e.phone}</span>
                            </div>

                            <div className="lead-message-box">
                              <small>CLIENT REQUIREMENT</small>
                              {e.details || "Inquiry submitted via website contact form."}
                            </div>

                            {e.notes && (
                              <div className="lead-notes-box">
                                <b>Internal Follow-Up Note:</b> {e.notes}
                              </div>
                            )}

                            <div className="lead-actions-bar">
                              <a
                                className="btn-lead-whatsapp"
                                href={`https://wa.me/${cleanPhone.replace('+', '')}?text=${waText}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open WhatsApp chat with client"
                              >
                                <MessageCircle size={14} /> WhatsApp
                              </a>

                              <a className="btn-lead-call" href={`tel:${cleanPhone}`} title="Call client">
                                <Phone size={14} /> Call
                              </a>

                              <select
                                className="lead-status-dropdown"
                                value={status}
                                onChange={async ev => {
                                  await mutate({ action: 'updateEnquiry', id: e.id, data: { status: ev.target.value } });
                                }}
                              >
                                <option value="New">Status: New</option>
                                <option value="Contacted">Status: Contacted</option>
                                <option value="Site Visit Scheduled">Status: Site Visit</option>
                                <option value="Converted to Project">Status: Converted</option>
                                <option value="Closed">Status: Closed</option>
                              </select>

                              <button
                                className="btn-lead-convert"
                                title="Convert this lead into an active project"
                                onClick={() => {
                                  setModal({
                                    type: 'project',
                                    prefill: {
                                      name: `${e.name}'s Residence`,
                                      client: e.name,
                                      location: e.city,
                                      type: e.type.includes('society') ? 'Housing society' : 'Independent home',
                                      description: e.details,
                                    }
                                  });
                                }}
                              >
                                <Plus size={14} /> Convert to Project
                              </button>

                              <button
                                className="icon-btn danger"
                                title="Delete this inquiry"
                                onClick={() => setModal({ type: 'deleteEnquiry', enquiry: e })}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {!filteredEnquiries.length && (
                      <Empty text={query ? "No inquiries matching your search." : "No inquiries in this category. Website form submissions will automatically appear here."} />
                    )}
                  </div>
                )}

                {/* TAB: PROJECTS */}
                {tab === 'projects' && (
                  <div className="project-management">
                    {filteredProjects.map(p => (
                      <div className="panel project-detail" key={p.id}>
                        <img loading="lazy" src={p.image} alt="Project cover representation" />
                        <div className="project-detail-content">
                          <div className="row">
                            <Tag>{p.status}</Tag>
                            {role === 'contractor' && (
                              <button className="icon-btn" aria-label={'Edit ' + p.name} onClick={() => setModal({ type: 'project', project: p })}>
                                <Pencil size={17} />
                              </button>
                            )}
                          </div>
                          <h2>{p.name}</h2>
                          <p>{p.location} · {p.area}</p>
                          <div className="progress"><span style={{ width: p.progress + '%' }} /></div>
                          <div className="row">
                            <small>{p.stage}</small>
                            <strong>{p.progress}%</strong>
                          </div>
                          <div className="project-facts">
                            <div>
                              <small>CLIENT</small>
                              <strong>{p.client}</strong>
                            </div>
                            <div>
                              <small>CONTRACT VALUE</small>
                              <strong>{money(p.budget)}</strong>
                            </div>
                          </div>
                          <p>{p.description}</p>
                          <div className="row">
                            <Tag tone="neutral">{p.isPublic ? "Published in Public Portfolio" : "Private Project"}</Tag>
                            <button className="text-btn" onClick={() => { setSelected(p.id); setTab('documents'); }}>
                              Documents & Drawings <ArrowRight size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!filteredProjects.length && <Empty text="No projects found matching this filter." />}
                  </div>
                )}

                {/* TAB: FINANCIAL & SITE RECORD TABLES */}
                {labels[tab] && (
                  <>
                    <div className="record-summary">
                      {tab === 'payment' && (
                        <>
                          <span>Total Instalments <b>{money(sum('payment', 'amount'))}</b></span>
                          <span>Received <b>{money(sum('payment', 'paid'))}</b></span>
                          <span>Outstanding Balance <b>{money(due)}</b></span>
                        </>
                      )}
                      {tab === 'expense' && (
                        <>
                          <span>Total Material Invoices <b>{money(sum('expense', 'amount'))}</b></span>
                          <span>Disbursed <b>{money(sum('expense', 'paid'))}</b></span>
                          <span>Pending Supplier Dues <b>{money(sum('expense', 'amount') - sum('expense', 'paid'))}</b></span>
                        </>
                      )}
                      {tab === 'labour' && (
                        <>
                          <span>Accrued Wages <b>{money(sum('labour', 'amount'))}</b></span>
                          <span>Advance Paid <b>{money(sum('labour', 'advance'))}</b></span>
                          <span>Net Payable Wages <b>{money(sum('labour', 'amount') - sum('labour', 'advance') - sum('labour', 'paid'))}</b></span>
                        </>
                      )}
                    </div>
                    <div className="panel table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>RECORD TITLE</th>
                            <th>PROJECT</th>
                            <th>{tab === 'payment' ? "DUE DATE" : "DATE"}</th>
                            <th>{tab === 'agreement' ? "STATUS" : "AMOUNT / STATUS"}</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {currentRecords.filter(r => r.kind === tab).map(r => (
                            <tr key={r.id}>
                              <td>
                                <button className="record-link" onClick={() => setModal({ type: 'detail', entry: r })}>
                                  {r.data.title}
                                </button>
                                {r.data.supplier && <small>{r.data.supplier}</small>}
                                {tab === 'labour' && <small>{r.data.days} day(s) × {money(r.data.rate)}</small>}
                              </td>
                              <td>{projectName(r.projectId)}</td>
                              <td>{r.data.date}</td>
                              <td>
                                {r.kind === 'quotation' ? money(quotationTotal(r.data.lines, r.data.tax).total) :
                                 r.kind === 'agreement' ? <Tag tone="neutral">{r.data.status}</Tag> :
                                 r.kind === 'update' ? <Tag>Recorded</Tag> : (
                                   <>
                                     <b>{money(r.data.amount)}</b>
                                     {['payment', 'expense'].includes(r.kind) && (
                                       <small>{r.data.amount - r.data.paid > 0 ? money(r.data.amount - r.data.paid) + " pending" : "Fully settled"}</small>
                                     )}
                                   </>
                                 )}
                              </td>
                              <td>
                                <button className="icon-btn" aria-label={'View ' + r.data.title} onClick={() => setModal({ type: 'detail', entry: r })}>
                                  <ArrowUpRight size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!currentRecords.some(r => r.kind === tab) && <Empty text={'No ' + labels[tab].toLowerCase() + ' recorded yet.'} />}
                    </div>
                  </>
                )}

                {/* TAB: DOCUMENTS */}
                {tab === 'documents' && (
                  <div className="panel">
                    <div className="panel-head">
                      <div>
                        <h2>Project Documents, Blueprints & Bills</h2>
                        <p>PDF, JPG, PNG, WebP · Up to 10 MB per file · Supabase cloud storage</p>
                      </div>
                      {role !== 'client' && (
                        <button className="btn dark small" onClick={() => visibleProjects.length ? setModal({ type: 'upload' }) : notify("Please add a project first.")}>
                          <Upload size={15} /> Upload File
                        </button>
                      )}
                    </div>
                    {files.filter(f => (selected === 'all' || f.project_id === selected) && (role !== 'client' || f.shared)).map(f => (
                      <div className="file-row" key={f.id}>
                        <FileText />
                        <div>
                          <strong>{f.name}</strong>
                          <small>{projectName(f.project_id)} · {Math.ceil(f.size / 1024)} KB · {f.shared ? "Shared with client" : "Internal team only"}</small>
                        </div>
                        <a className="btn outline small" href={'/api/files?id=' + f.id}>
                          Download <Download size={15} />
                        </a>
                      </div>
                    ))}
                    {!files.length && (
                      <Empty text={demo ? "Sample preview has no pre-loaded files. Upload architectural blueprints, bills, and signed contracts to test." : "No documents uploaded yet. Upload your first project drawing or contract."} />
                    )}
                  </div>
                )}

                {/* TAB: TEAM & ACCESS */}
                {tab === 'team' && (
                  <div className="panel">
                    <div className="panel-head">
                      <div>
                        <h2>Team & Client Access Permissions</h2>
                        <p>Role-based security rules enforced on every database request.</p>
                      </div>
                      <button className="btn dark small" onClick={() => setModal({ type: 'member' })}>
                        <Plus size={15} /> Grant Access
                      </button>
                    </div>
                    <div className="access-note">
                      Site supervisors can log daily progress updates, material expenses, worker attendance, and upload site photos. Clients can view their assigned project milestones, approved quotations, contracts, and payment balances.
                    </div>
                    {members.map(m => (
                      <div className="file-row" key={m.email}>
                        <span className="avatar">{initials(m.email)}</span>
                        <div>
                          <strong>{m.email}</strong>
                          <small>{m.role} · {m.projectIds.map(projectName).join(', ')}</small>
                        </div>
                        <button className="icon-btn" aria-label={'Remove access for ' + m.email} onClick={() => setModal({ type: 'removeMember', member: m })}>
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ))}
                    {!members.length && <Empty text="No team members or clients added yet. Click 'Grant Access' to invite supervisors or clients." />}
                  </div>
                )}

                {/* TAB: AUDIT LOG */}
                {tab === 'audit' && (
                  <div className="panel">
                    <div className="panel-head">
                      <h2>Audit Trail & Change History</h2>
                      <p>Latest 100 operations · Snapshot of all created, updated, or deleted records</p>
                    </div>
                    {audit.map(a => (
                      <div className="file-row" key={a.id}>
                        <FileText size={18} />
                        <div>
                          <strong>{a.action === 'record.created' ? 'New record added' : a.action === 'record.updated' ? 'Record modified' : 'Record removed'}</strong>
                          <small>{a.actor_email} · {new Date(a.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</small>
                          <small>Ref: {a.entity_id}</small>
                        </div>
                      </div>
                    ))}
                    {!audit.length && <Empty text="History of added, modified, or removed records in your live workspace will appear here." />}
                  </div>
                )}

                {/* TAB: SETTINGS */}
                {tab === 'settings' && (
                  <form
                    className="panel settings-form"
                    onSubmit={async e => {
                      e.preventDefault();
                      setBusy(true);
                      try {
                        await mutate({ action: 'settings', data: Object.fromEntries(new FormData(e.currentTarget)) });
                      } catch (err) {
                        notify((err as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <h2>Company & Website Settings</h2>
                    <Field label="Company Name" name="name" defaultValue={settings.name} required />
                    <Field label="City / Operating Region" name="location" defaultValue={settings.location} />
                    <Field label="WhatsApp Contact Number (with country code, e.g. 919829012345)" name="phone" defaultValue={settings.phone} placeholder="919829012345" />
                    <label>
                      About the Company (Shown on website)
                      <textarea name="about" defaultValue={settings.about} rows={4} />
                    </label>
                    <button className="btn dark" disabled={busy}>
                      Save Company Details <Check size={17} />
                    </button>
                    <p className="fine">Saved settings immediately update your public website, portfolio headers, and WhatsApp consultation links.</p>
                  </form>
                )}
              </main>

              <div className="app-footer">
                Engineered for professional construction management.
                <span>{demo ? "Viewing sample demonstration data." : "All records securely persisted in PostgreSQL/Supabase."}</span>
              </div>
            </div>
          </div>
        )}

        {/* TOAST NOTIFICATION */}
        {toast && (
          <div className="toast" role="status">
            <CheckCircle2 size={19} />
            {toast}
            <button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={16} /></button>
          </div>
        )}

        {/* MODALS */}
        {modal && (
          <Modal
            title={
              modal.type === 'portfolio' ? modal.project.name :
              modal.type === 'project' ? (modal.project ? "Edit Project" : "Start New Project") :
              modal.type === 'record' ? (modal.entry ? 'Edit: ' : 'New Record: ') + labels[modal.kind] :
              modal.type === 'detail' ? modal.entry.data.title :
              modal.type === 'initialize' ? "Set Up Your Workspace" :
              modal.type === 'upload' ? "Upload Project Document" :
              modal.type === 'member' ? "Grant Project Access" :
              modal.type === 'auth' ? "Sign In to Admin Workspace" :
              modal.type === 'deleteEnquiry' ? "Delete Website Inquiry?" :
              modal.type === 'removeMember' ? "Revoke Access?" : "Delete Record?"
            }
            close={() => {
              if (!busy) {
                setModal(null);
                setError('');
              }
            }}
          >
            {modal.type === 'portfolio' && (
              <div className="portfolio-modal">
                <img src={modal.project.image} alt={modal.project.name} />
                <div className="row">
                  <Tag>{modal.project.type}</Tag>
                  <span>{modal.project.area}</span>
                </div>
                <p>{modal.project.location}</p>
                <p>{modal.project.description}</p>
                {publicProjects === null && (
                  <p className="fine">This is a sample project and illustrative photograph showcasing the portfolio layout.</p>
                )}
                <a className="btn dark" href="#contact" onClick={() => setModal(null)}>
                  Discuss a Similar Project <ArrowUpRight size={17} />
                </a>
              </div>
            )}

            {modal.type === 'auth' && (
              <div className="admin-auth-card">
                <p>Sign in to open your live Supabase workspace, view website inquiries, and manage construction accounts.</p>
                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const email = (new FormData(form).get('email') as string).trim();
                    await openLive(email);
                    setModal(null);
                  }}
                >
                  <Field label="Owner / Team Email" name="email" type="email" required defaultValue="owner@example.com" placeholder="owner@example.com" />
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button className="btn dark" style={{ flex: 1 }} disabled={busy}>
                      {busy ? "Signing in…" : "Sign In to Live Workspace"} <ArrowRight size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn outline"
                      onClick={() => {
                        openDemo();
                        setModal(null);
                      }}
                    >
                      Use Sample Preview
                    </button>
                  </div>
                </form>
              </div>
            )}

            {modal.type === 'detail' && (
              <>
                <Document entry={modal.entry} project={projects.find(p => p.id === modal.entry.projectId)} business={settings.name} />
                <div className="modal-actions">
                  <button className="btn outline" onClick={() => print(modal.entry)}>
                    <Download size={16} /> Print / Save PDF
                  </button>
                  {canWrite(role, modal.entry.kind) && (
                    <button className="btn dark" onClick={() => setModal({ type: 'record', kind: modal.entry.kind, entry: modal.entry, projectId: modal.entry.projectId })}>
                      <Pencil size={16} /> Edit Record
                    </button>
                  )}
                  {role === 'contractor' && (
                    <button className="icon-btn danger" aria-label="Delete record" onClick={() => setModal({ type: 'delete', entry: modal.entry })}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </>
            )}

            {modal.type === 'record' && (
              <RecordForm
                kind={modal.kind}
                entry={modal.entry}
                projectId={modal.projectId}
                projects={visibleProjects}
                busy={busy}
                save={async (data: any) => {
                  setBusy(true);
                  setError('');
                  try {
                    await mutate({ action: 'record', kind: modal.kind, id: modal.entry?.id, ...data });
                    setModal(null);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            )}

            {modal.type === 'project' && (
              <ProjectForm
                files={files}
                project={modal.project}
                prefill={modal.prefill}
                busy={busy}
                save={async (data: any) => {
                  setBusy(true);
                  setError('');
                  try {
                    await mutate({ action: 'project', data });
                    setModal(null);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            )}

            {modal.type === 'initialize' && (
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  setBusy(true);
                  setError('');
                  try {
                    await mutate({ action: 'initialize', ...Object.fromEntries(new FormData(e.currentTarget)) });
                    setModal(null);
                  } catch (err) {
                    setError((err as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <p>Your workspace starts fresh. As the contractor/owner, you will manage construction sites, budgets, documents, and customer inquiries.</p>
                <Field label="Company Name" name="name" required defaultValue="Mahendra Real Estate" />
                <Field label="City / Operating Region" name="location" required placeholder="e.g. Kota, Rajasthan" />
                <button className="btn dark" disabled={busy}>
                  Create My Workspace <ArrowRight size={17} />
                </button>
              </form>
            )}

            {modal.type === 'member' && (
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  setBusy(true);
                  setError('');
                  const f = new FormData(e.currentTarget);
                  try {
                    if (!f.getAll('projectIds').length) throw new Error("Please select at least one project.");
                    await mutate({ action: 'member', data: { email: f.get('email'), role: f.get('role'), projectIds: f.getAll('projectIds') } });
                    setModal(null);
                  } catch (err) {
                    setError((err as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Field label="User Email" name="email" type="email" required />
                <label>
                  Role
                  <select name="role">
                    <option value="supervisor">Site Supervisor</option>
                    <option value="client">Client</option>
                  </select>
                </label>
                <fieldset>
                  <legend>Assigned Projects</legend>
                  {visibleProjects.map(p => (
                    <label className="check-label" key={p.id}>
                      <input name="projectIds" value={p.id} type="checkbox" />{p.name}
                    </label>
                  ))}
                </fieldset>
                <p className="fine">Permissions will be saved securely. The user signs in with this registered email address.</p>
                <button className="btn dark" disabled={busy || !visibleProjects.length}>
                  Save Permissions <Check size={16} />
                </button>
              </form>
            )}

            {modal.type === 'upload' && (
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  setBusy(true);
                  setError('');
                  try {
                    if (demo) {
                      notify("Upload simulated in demo mode. Connect to live Supabase to persist files.");
                      setModal(null);
                      return;
                    }
                    const f = new FormData(e.currentTarget);
                    f.set('shared', f.get('shared') ? 'true' : 'false');
                    const r = await fetch('/api/files', { method: 'POST', body: f });
                    const d: any = await r.json();
                    if (!r.ok) throw new Error(d.error);
                    notify("File uploaded successfully");
                    setModal(null);
                    try {
                      const s = await fetch('/api/workspace');
                      if (!s.ok) throw new Error();
                      apply(await s.json());
                    } catch {
                      notify("File saved. Please reload page to refresh list.");
                    }
                  } catch (err) {
                    setError((err as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label>
                  Project
                  <select name="projectId" defaultValue={selected === 'all' ? visibleProjects[0]?.id : selected}>
                    {visibleProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
                <label className="upload-box">
                  <Upload />
                  <strong>Select blueprint, bill, photo or contract</strong>
                  <span>PDF, JPG, PNG or WebP · Up to 10 MB</span>
                  <input name="file" type="file" required accept="application/pdf,image/jpeg,image/png,image/webp" />
                </label>
                <label className="check-label">
                  <input type="checkbox" name="shared" />Share with this project's client
                </label>
                <button className="btn dark" disabled={busy}>
                  Upload File <Upload size={16} />
                </button>
              </form>
            )}

            {modal.type === 'deleteEnquiry' && (
              <>
                <p>Are you sure you want to remove the inquiry from <strong>{modal.enquiry.name}</strong> ({modal.enquiry.city})?</p>
                <button
                  disabled={busy}
                  className="btn danger-fill"
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await mutate({ action: 'deleteEnquiry', id: modal.enquiry.id });
                      setModal(null);
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Yes, Remove Inquiry
                </button>
              </>
            )}

            {['delete', 'removeMember'].includes(modal.type) && (
              <>
                <p>{modal.type === 'delete' ? "This will permanently delete this record from the system." : "This will revoke workspace access for this user."}</p>
                <button
                  disabled={busy}
                  className="btn danger-fill"
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await mutate(modal.type === 'delete' ? { action: 'deleteRecord', id: modal.entry.id } : { action: 'removeMember', email: modal.member.email });
                      setModal(null);
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Yes, Remove
                </button>
              </>
            )}

            {error && <p className="form-error" role="alert">{error}</p>}
          </Modal>
        )}
      </div>

      <div className="print-only">
        {printEntry && <Document entry={printEntry} project={projects.find(p => p.id === printEntry.projectId)} business={settings.name} />}
      </div>
    </>
  );
}

function ArrowDown() {
  return <ArrowRight size={17} style={{ transform: 'rotate(90deg)' }} />;
}

function Field(props: any) {
  const { label, ...rest } = props;
  return (
    <label>
      {label}
      <input {...rest} />
    </label>
  );
}

function Stat({ label, value, foot, icon }: any) {
  return (
    <div className="stat">
      <div>
        <span>{label}</span>
        {icon}
      </div>
      <strong>{value}</strong>
      <small>{foot}</small>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <FolderOpen size={28} />
      <p>{text}</p>
    </div>
  );
}

function ProjectCard({ p, onClick }: { p: Project; onClick: () => void }) {
  return (
    <button className="dash-project" onClick={onClick}>
      <div className="dash-project-image">
        <img loading="lazy" src={p.image} alt="Illustrative project cover" />
        <Tag>{p.status}</Tag>
      </div>
      <div className="dash-project-body">
        <h3>{p.name}</h3>
        <p><MapPin size={13} />{p.location}</p>
        <div className="progress"><span style={{ width: p.progress + '%' }} /></div>
        <div className="row">
          <small>{p.stage}</small>
          <strong>{p.progress}%</strong>
        </div>
      </div>
    </button>
  );
}

function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();

    function key(e: KeyboardEvent) {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab') {
        const els = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]') || []);
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, []);

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={ref} tabIndex={-1}>
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-btn" onClick={close} aria-label="Close dialog"><X /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ProjectForm({ project, prefill, busy, save, files }: { project?: Project; prefill?: any; busy: boolean; save: (d: any) => void; files: any[] }) {
  const initial = project || prefill || {};
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.currentTarget));
        save({
          ...f,
          id: project?.id,
          budget: paise(f.budget),
          progress: Number(f.progress),
          isPublic: f.isPublic === 'on'
        });
      }}
    >
      <div className="form-two">
        <Field label="Project Name" name="name" required defaultValue={initial.name} placeholder="e.g. Modern Villa" />
        <Field label="Client Name" name="client" required defaultValue={initial.client} placeholder="Client Name" />
      </div>
      <div className="form-two">
        <Field label="Location" name="location" required defaultValue={initial.location} placeholder="City, State" />
        <Field label="Built-Up Area / Units" name="area" defaultValue={initial.area} placeholder="e.g. 2,400 sq ft" />
      </div>
      <div className="form-two">
        <label>
          Project Type
          <select name="type" defaultValue={initial.type || "Independent home"}>
            <option value="Independent home">{displayValue("Independent home")}</option>
            <option value="Housing society">{displayValue("Housing society")}</option>
            <option value="Other Residential Project">Other Residential Project</option>
          </select>
        </label>
        <Field label="Contract Value (₹)" name="budget" type="number" min="0" max="10000000000" step="0.01" defaultValue={(project?.budget || 0) / 100} required />
      </div>
      <div className="form-two">
        <label>
          Status
          <select name="status" defaultValue={project?.status || "In progress"}>
            <option value="In progress">{displayValue("In progress")}</option>
            <option value="Completed">{displayValue("Completed")}</option>
            <option value="On hold">{displayValue("On hold")}</option>
          </select>
        </label>
        <Field label="Current Progress (%)" name="progress" type="number" min="0" max="100" defaultValue={project?.progress || 0} required />
      </div>
      <Field label="Current Stage" name="stage" defaultValue={project?.stage || 'Foundation & Planning'} />
      <label>
        Project Description
        <textarea name="description" defaultValue={initial.description} rows={3} placeholder="Project scope, architectural style, and milestones…" />
      </label>
      <label>
        Project Cover Image
        <select name="image" defaultValue={project?.image || '/house.jpg'}>
          <option value="/house.jpg">Modern Home (sample)</option>
          <option value="/garden.jpg">Garden Residence (sample)</option>
          <option value="/society.jpg">Residential Society (sample)</option>
          {files.filter(f => f.project_id === project?.id && f.type.startsWith("image/")).map(f => (
            <option key={f.id} value={"/api/files?id=" + f.id}>{f.name} · uploaded photo</option>
          ))}
        </select>
      </label>
      <label className="check-label">
        <input type="checkbox" name="isPublic" defaultChecked={project?.isPublic} />Display completed project in public portfolio
      </label>
      <p className="fine">Cover photos appear on your website once marked for public portfolio.</p>
      <button className="btn dark" disabled={busy}>
        {busy ? "Saving…" : "Save Project"} <Check size={17} />
      </button>
    </form>
  );
}

function RecordForm({ kind, entry, projectId, projects, busy, save }: any) {
  const d = entry?.data || {};
  const [lines, setLines] = useState<any[]>(d.lines?.map((l: any) => ({ ...l, rate: l.rate / 100 })) || [{ description: '', qty: 1, unit: 'sq ft', rate: 0 }]);
  const [tax, setTax] = useState(d.tax || 0);
  const [err, setErr] = useState('');
  const total = (() => {
    try {
      return quotationTotal(lines.map(l => ({ ...l, rate: paise(l.rate || 0), qty: Number(l.qty || 0) })), Number(tax || 0));
    } catch {
      return { subtotal: 0, taxAmount: 0, total: 0 };
    }
  })();

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        setErr('');
        try {
          const f = Object.fromEntries(new FormData(e.currentTarget));
          const data: any = { ...f };
          delete data.projectId;
          for (const k of ['amount', 'paid', 'rate', 'advance']) {
            if (f[k] !== undefined) data[k] = paise(f[k]);
          }
          if (kind === 'labour') {
            data.days = Number(f.days);
            data.amount = Math.round(data.days * data.rate);
          }
          if (['expense', 'payment'].includes(kind) && data.paid > data.amount) {
            throw new Error("Paid amount cannot exceed the total amount.");
          }
          if (kind === 'quotation') {
            data.lines = lines.map(l => ({ ...l, qty: Number(l.qty), rate: paise(l.rate) }));
            data.tax = Number(tax);
            if (data.lines.some((l: any) => !l.description.trim() || l.qty <= 0)) {
              throw new Error("Please fill in complete details for each item.");
            }
            Object.assign(data, quotationTotal(data.lines, data.tax));
          }
          save({ projectId: entry ? projectId : f.projectId, data });
        } catch (error) {
          setErr((error as Error).message);
        }
      }}
    >
      <label>
        Project
        <select name="projectId" defaultValue={projectId} disabled={!!entry}>
          {projects.map((p: Project) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>

      <div className="form-two">
        <Field label={kind === 'labour' ? "Worker Name / Trade" : "Record Title"} name="title" required defaultValue={d.title} />
        <Field label={kind === 'payment' ? "Payment Due Date" : "Date"} name="date" type="date" required defaultValue={d.date || date()} />
      </div>

      {kind === 'expense' && (
        <div className="form-two">
          <Field label="Supplier / Vendor" name="supplier" required defaultValue={d.supplier} />
          <label>
            Category
            <select name="category" defaultValue={d.category}>
              <option value="Materials">{displayValue("Materials")}</option>
              <option value="Transport">{displayValue("Transport")}</option>
              <option value="Equipment">{displayValue("Equipment")}</option>
              <option value="Other expense">{displayValue("Other expense")}</option>
            </select>
          </label>
        </div>
      )}

      {['expense', 'payment'].includes(kind) && (
        <div className="form-two">
          <Field label={kind === 'payment' ? "Instalment Amount (₹)" : "Invoice Amount (₹)"} name="amount" type="number" min="0" max="10000000000" step="0.01" required defaultValue={(d.amount || 0) / 100} />
          <Field label={kind === 'payment' ? "Amount Received (₹)" : "Amount Paid (₹)"} name="paid" type="number" min="0" max="10000000000" step="0.01" required defaultValue={(d.paid || 0) / 100} />
        </div>
      )}

      {kind === 'labour' && (
        <>
          <div className="form-two">
            <Field label="Attendance / Days Worked" name="days" type="number" min="0" max="31" step="0.5" required defaultValue={d.days ?? 1} />
            <Field label="Daily Wage Rate (₹)" name="rate" type="number" min="0" max="10000000000" step="0.01" required defaultValue={(d.rate || 0) / 100} />
          </div>
          <div className="form-two">
            <Field label="Advance Wage Paid (₹)" name="advance" type="number" min="0" max="10000000000" step="0.01" required defaultValue={(d.advance || 0) / 100} />
            <Field label="Paid in Addition to Advance (₹)" name="paid" type="number" min="0" max="10000000000" step="0.01" required defaultValue={(d.paid || 0) / 100} />
          </div>
          <p className="fine">Record entries per worker or wage period. Excess advance adjusts against future days.</p>
        </>
      )}

      {kind === 'quotation' && (
        <>
          <div className="line-heading">ITEM-WISE ESTIMATE <span>Amounts in ₹</span></div>
          {lines.map((l, i) => (
            <div className="quote-line" key={i}>
              <label className="line-description">
                Item Description
                <input aria-label={'Item ' + (i + 1) + ' description'} value={l.description} required onChange={e => setLines(lines.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
              </label>
              <label>
                Qty
                <input type="number" step="0.001" min="0.001" max="1000000" required value={l.qty} onChange={e => setLines(lines.map((x, j) => j === i ? { ...x, qty: e.target.value } : x))} />
              </label>
              <label>
                Unit
                <input value={l.unit} onChange={e => setLines(lines.map((x, j) => j === i ? { ...x, unit: e.target.value } : x))} />
              </label>
              <label>
                Rate
                <input type="number" min="0" max="10000000000" step="0.01" required value={l.rate} onChange={e => setLines(lines.map((x, j) => j === i ? { ...x, rate: e.target.value } : x))} />
              </label>
              <button type="button" className="icon-btn" disabled={lines.length === 1} aria-label={'Remove item ' + (i + 1)} onClick={() => setLines(lines.filter((_, j) => j !== i))}>
                <X size={15} />
              </button>
            </div>
          ))}
          <button type="button" className="text-btn" disabled={lines.length >= 100} onClick={() => setLines([...lines, { description: '', qty: 1, unit: 'sq ft', rate: 0 }])}>
            <Plus size={16} /> Add Line Item
          </button>
          <div className="quote-total">
            <label>
              Tax Rate (%)
              <input type="number" min="0" max="100" step="0.01" value={tax} onChange={e => setTax(e.target.value)} required />
            </label>
            <div>
              <small>Subtotal {money(total.subtotal)} · Tax {money(total.taxAmount)}</small>
              <strong>Total {money(total.total)}</strong>
            </div>
          </div>
          <p className="fine">Tax defaults to 0%. This is an itemized construction estimate for planning purposes.</p>
        </>
      )}

      {kind === 'agreement' && (
        <>
          <label>
            Scope of Work
            <textarea name="scope" required defaultValue={d.scope} rows={4} placeholder="Included structural works, material specifications, excluded items…" />
          </label>
          <label>
            Terms & Milestones
            <textarea name="terms" defaultValue={d.terms} rows={4} placeholder="Start and completion dates, milestone payment stages, variation clauses, handover terms…" />
          </label>
          <label>
            Status
            <select name="status" defaultValue={d.status || 'Draft'}>
              <option value="Draft">{displayValue("Draft")}</option>
              <option value="Signed copy filed">{displayValue("Signed copy filed")}</option>
            </select>
          </label>
          <p className="fine">Contractual terms and milestone agreements. Upload physical or signed digital copies under Documents.</p>
        </>
      )}

      <label>
        {kind === 'update' ? "Site Progress / Next Steps" : "Additional Notes"}
        <textarea name="notes" defaultValue={d.notes} rows={3} maxLength={10000} />
      </label>

      {err && <p className="form-error">{err}</p>}
      <button className="btn dark" disabled={busy}>
        {busy ? "Saving…" : "Save Record"} <Check size={17} />
      </button>
    </form>
  );
}

function Document({ entry: r, project: p, business }: any) {
  const d = r.data;
  const totals = r.kind === 'quotation' ? quotationTotal(d.lines, d.tax) : null;
  return (
    <div className="document">
      <div className="document-brand">
        <Logo name={business} />
        <span>{r.kind === 'quotation' ? 'ESTIMATE' : r.kind === 'payment' ? 'INSTALMENT STATEMENT' : r.kind.toUpperCase()}</span>
      </div>
      <h2>{d.title}</h2>
      <p>{p?.name} · {p?.client}</p>
      <div className="document-meta">
        <span>{r.kind === 'payment' ? 'Due Date' : 'Date'}: {d.date}</span>
        <span>Ref: {r.id.slice(0, 8).toUpperCase()}</span>
      </div>
      {totals && (
        <>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {d.lines.map((l: any, i: number) => (
                <tr key={i}>
                  <td>{l.description}</td>
                  <td>{l.qty} {l.unit}</td>
                  <td>{money(l.rate)}</td>
                  <td>{money(quotationTotal([l], 0).subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="document-totals">
            <p>Subtotal <b>{money(totals.subtotal)}</b></p>
            <p>Tax ({d.tax}%) <b>{money(totals.taxAmount)}</b></p>
            <p>Total <b>{money(totals.total)}</b></p>
          </div>
        </>
      )}
      {['expense', 'payment', 'labour'].includes(r.kind) && (
        <div className="document-totals">
          {d.supplier && <p>Supplier <b>{d.supplier}</b></p>}
          <p>{r.kind === 'labour' ? "Accrued Wages" : "Total Amount"}<b>{money(d.amount)}</b></p>
          {r.kind === 'labour' && (
            <>
              <p>Days × Daily Rate <b>{d.days} × {money(d.rate)}</b></p>
              <p>Advance Paid <b>{money(d.advance)}</b></p>
            </>
          )}
          <p>{r.kind === 'payment' ? "Amount Received" : "Amount Paid"}<b>{money(d.paid)}</b></p>
          <p>Balance <b>{money(d.amount - d.paid - (d.advance || 0))}</b></p>
        </div>
      )}
      {r.kind === 'agreement' && (
        <>
          <Tag>{d.status}</Tag>
          <h3>Scope of Work</h3>
          <p className="preserve">{d.scope}</p>
          <h3>Terms & Milestones</h3>
          <p className="preserve">{d.terms || "No additional conditions recorded."}</p>
        </>
      )}
      {d.notes && (
        <>
          <h3>Additional Notes</h3>
          <p className="preserve">{d.notes}</p>
        </>
      )}
      <div className="document-foot">
        {p?.id?.startsWith("sample-") && <strong>SAMPLE DATA · FOR PREVIEW ONLY. </strong>}
        {r.kind === 'quotation' ? "This is an itemized estimate only. Confirm specifications, taxes, and exclusions prior to formal sign-off." :
         r.kind === 'agreement' ? "Contractual record. Physical or digital signatures should be executed separately." :
         "Generated from verified project records. Reconcile with underlying invoices and receipts."}
      </div>
    </div>
  );
}
