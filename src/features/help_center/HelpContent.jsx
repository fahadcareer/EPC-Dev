import React from 'react';
import { Info, AlertCircle, CheckCircle, ExternalLink, ArrowRight, Paperclip, HelpCircle, Cpu, Activity, Layers, Target, X } from 'lucide-react';

const Note = ({ children }) => (
    <div className="my-6 bg-indigo-500/5 border-l-4 border-indigo-500 p-4 rounded-r-lg flex gap-4 transition-colors duration-300">
        <Info className="text-indigo-500 shrink-0" size={20} />
        <div className="text-theme-secondary text-[15px] leading-relaxed">
            <span className="font-bold text-theme-primary block mb-1">Note</span>
            {children}
        </div>
    </div>
);

const Tip = ({ children }) => (
    <div className="my-6 bg-emerald-500/5 border-l-4 border-emerald-500 p-4 rounded-r-lg flex gap-4 transition-colors duration-300">
        <CheckCircle className="text-emerald-500 shrink-0" size={20} />
        <div className="text-theme-secondary text-[15px] leading-relaxed">
            <span className="font-bold text-theme-primary block mb-1">Tip</span>
            {children}
        </div>
    </div>
);

const Caution = ({ children }) => (
    <div className="my-6 bg-rose-500/5 border-l-4 border-rose-500 p-4 rounded-r-lg flex gap-4 transition-colors duration-300">
        <AlertCircle className="text-rose-500 shrink-0" size={20} />
        <div className="text-theme-secondary text-[15px] leading-relaxed">
            <span className="font-bold text-theme-primary block mb-1 text-rose-500">Caution</span>
            {children}
        </div>
    </div>
);

const Step = ({ number, title, children }) => (
    <div className="flex gap-4 mb-8 group">
        <div className="w-8 h-8 rounded-full bg-theme-accent text-white flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
            {number}
        </div>
        <div>
            <h3 className="text-lg font-bold text-theme-primary mb-2">{title}</h3>
            <div className="text-theme-secondary leading-relaxed text-[16px]">
                {children}
            </div>
        </div>
    </div>
);

const WelcomeContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-6 tracking-tight">Welcome to Meerana Tasree3</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed font-medium">
            Tasree3 Process Reengineering is an enterprise-grade Business Process Management (BPM) platform designed to bridge the gap between business strategy and digital execution.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-4">Scientific Process Modeling</h2>
            <p className="text-theme-secondary leading-relaxed mb-6">
                Using the **Event-driven Process Chain (EPC)** methodology, Tasree3 Process Reengineering allows organizations to model, analyze, and optimize their business processes with scientific precision. Our platform provides a unified language for both business stakeholders and IT departments.
            </p>
        </section>

        <section className="bg-app-surface rounded-3xl p-8 border border-theme-border shadow-sm">
            <h3 className="text-sm font-black text-theme-tertiary uppercase tracking-widest mb-4">Core Philosophy</h3>
            <p className="text-theme-secondary text-[15px] italic leading-relaxed">
                "We believe that a well-defined process is the foundation of digital transformation. Tasree3 Process Reengineering is built to capture every trigger, every task, and every rule that drives your business forward."
            </p>
        </section>
    </div>
);

const SignUpContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-6 tracking-tight">Access & Provisioning</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Meerana Tasree3 uses a restricted organization-based access model to ensure the highest level of security.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">How Access is Granted</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="p-6 rounded-2xl border border-theme-border bg-app-surface shadow-sm hover:shadow-md transition-all">
                    <h4 className="font-bold text-theme-accent mb-2">Manager Provisioning</h4>
                    <p className="text-sm text-theme-tertiary leading-relaxed">For new enterprise clients, the Tasree3 System Administrator creates the primary **Manager** account during initial setup.</p>
                </div>
                <div className="p-6 rounded-2xl border border-theme-border bg-app-surface shadow-sm hover:shadow-md transition-all">
                    <h4 className="font-bold text-theme-accent mb-2">Member Onboarding</h4>
                    <p className="text-sm text-theme-tertiary leading-relaxed">Once active, Managers can register additional employees or contractors directly via the Management Dashboard.</p>
                </div>
            </div>

            <div className="space-y-12 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-[2px] before:bg-theme-border">
                <Step number="1" title="Request Access">
                    Contact your internal BPM Lead or IT Administrator to request an account on the Meerana Tasree3 platform.
                </Step>
                <Step number="2" title="Activate Account">
                    You will receive an invitation email with your login credentials and a link to the portal.
                </Step>
                <Step number="3" title="First Login">
                    Navigate to the login page, enter your business email and the provided password. You will be prompted to update your profile upon first entry.
                </Step>
            </div>
        </section>

        <Note>
            There is no public self-registration. This restriction prevents unauthorized access and ensures all users are mapped to a verified Organization ID.
        </Note>
    </div>
);

const LoginContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-6 tracking-tight">Logging In</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Access your secure modeling hub to collaborate on process assets.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Standard Access</h2>
            <div className="space-y-6">
                <Step number="1" title="Credentials">
                    Enter your registered email and password in the login form.
                </Step>
                <Step number="2" title="Authentication">
                    Click **Sign In**. The system will authenticate your session and hydrate your workspace permissions.
                </Step>
            </div>
        </section>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Navigation after Login</h2>
            <div className="p-6 rounded-2xl bg-app-surface border border-theme-border">
                <ul className="space-y-3 text-sm text-theme-secondary">
                    <li className="flex items-center gap-2">
                        <ArrowRight size={14} className="text-theme-accent" />
                        **Admin Users:** Redirected to the Admin Dashboard for user and license management.
                    </li>
                    <li className="flex items-center gap-2">
                        <ArrowRight size={14} className="text-theme-accent" />
                        **Editors/Viewers:** Redirected to the Process Explorer (Home) to start modeling.
                    </li>
                </ul>
            </div>
        </section>

        <Tip>
            If you encounter a "Login Failed" error, check your internet connection or use the **Forgot Password** link to reset your credentials via email.
        </Tip>
    </div>
);

const UserRolesContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-4 tracking-tight">Understanding User Roles</h1>
        <p className="text-xl text-theme-secondary mb-10">The platform uses role-based access control (RBAC) to enforce governance.</p>

        <div className="grid grid-cols-1 gap-6">
            {[
                { title: 'Viewer', desc: 'Can browse the process tree, view diagrams, and read meta-information. Cannot create or modify items.' },
                { title: 'Designer', desc: 'Full modeling access within the Workspace. Can create folders, diagrams, and use AI-assisted tools.' },
                { title: 'Manager', desc: 'Administrative control over the organization. Can manage users, PDF branding, and Meta Templates.' },
                { title: 'Admin (System)', desc: 'High-level control over organizations and platform configuration.' }
            ].map((role, i) => (
                <div key={i} className="p-6 rounded-3xl border border-theme-border bg-app-surface flex gap-6 items-center shadow-sm hover:border-theme-accent/50 transition-colors">
                    <div className="w-16 h-16 rounded-2xl bg-theme-input flex items-center justify-center font-black text-theme-tertiary text-xl border border-theme-border">{role.title[0]}</div>
                    <div className="flex-1">
                        <h4 className="font-black text-theme-primary tracking-tight text-lg">{role.title}</h4>
                        <p className="text-theme-secondary text-[15px] leading-relaxed">{role.desc}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const NavBarContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-6 tracking-tight">Navigation Bar</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">The global utility layer at the top of your workspace.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl border border-theme-border bg-app-surface shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-theme-accent mb-6">
                    <Activity size={24} />
                </div>
                <h4 className="font-black text-theme-primary mb-3">Workspace Switcher</h4>
                <p className="text-theme-secondary text-sm leading-relaxed">Quickly toggle between your active modeling workspace and the management dashboard.</p>
            </div>
            <div className="p-8 rounded-3xl border border-theme-border bg-app-surface shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-theme-accent mb-6">
                    <HelpCircle size={24} />
                </div>
                <h4 className="font-black text-theme-primary mb-3">Support Hub</h4>
                <p className="text-theme-secondary text-sm leading-relaxed">Access this documentation, contact support, or view what's new in the latest release.</p>
            </div>
        </div>
    </div>
);

const WorkspaceOverviewContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-4 tracking-tight">Workspace Overview</h1>
        <p className="text-xl text-theme-secondary mb-10">Your enterprise command center for process transformation.</p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Key Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                {['Folders', 'Processes', 'Reviewers'].map((stat, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-app-surface border border-theme-border text-center">
                        <div className="text-2xl font-black text-theme-primary mb-1 underline decoration-theme-accent">0{i + 5}</div>
                        <div className="text-[11px] font-black text-theme-tertiary uppercase tracking-widest">{stat}</div>
                    </div>
                ))}
            </div>
        </section>
    </div>
);

const ExplorerMenuContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-6 tracking-tight">The Explorer Menu</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">Manage your process repository with the hierarchical tree sidebar.</p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6 font-black uppercase tracking-tight text-sm">Visual Cues & Hierarchy</h2>
            <div className="space-y-6 text-theme-secondary">
                <p>The Explorer uses distinct icons to help you navigate between experimental and operational states:</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-3xl border border-emerald-500/10 bg-emerald-500/5 shadow-sm">
                        <h4 className="font-black text-emerald-500 flex items-center gap-2 mb-3 uppercase tracking-widest text-[11px]">
                            <Layers size={18} />
                            As-Is Folders
                        </h4>
                        <p className="text-sm leading-relaxed opacity-80">Represent the current "live" state of business operations. These are for reference and auditing.</p>
                    </div>
                    <div className="p-6 rounded-3xl border border-theme-accent/10 bg-theme-accent/5 shadow-sm">
                        <h4 className="font-black text-theme-accent flex items-center gap-2 mb-3 uppercase tracking-widest text-[11px]">
                            <Target size={18} />
                            To-Be Folders
                        </h4>
                        <p className="text-sm leading-relaxed opacity-80">Represent future state optimizations. Modeling and simulation primarily occur in these containers.</p>
                    </div>
                </div>
            </div>
        </section>

        <section className="bg-theme-input rounded-[2rem] p-10 text-theme-primary border border-theme-border overflow-hidden relative shadow-lg">
            <div className="relative z-10">
                <h3 className="text-theme-accent font-black uppercase tracking-[0.2em] text-[10px] mb-4">Governance Rule</h3>
                <h2 className="text-2xl font-bold mb-6">Restricted Access</h2>
                <ul className="space-y-4 text-theme-secondary text-[15px]">
                    <li className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-theme-accent/20 flex items-center justify-center text-theme-accent shrink-0 font-bold text-xs">!</div>
                        <span>Folders named **"Approved"** or **"Workspace"** have specific creation restrictions.</span>
                    </li>
                    <li className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-theme-accent/20 flex items-center justify-center text-theme-accent shrink-0 font-bold text-xs">!</div>
                        <span>Finalized models with an "Approved" status are locked for editing to ensure data integrity.</span>
                    </li>
                </ul>
            </div>
        </section>
    </div>
);

const DiagramDetailsContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-6 tracking-tight">Viewing Diagram Details</h1>
        <p className="text-xl text-theme-secondary mb-10">Access contextual information and history for every process.</p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">The Information Tabs</h2>
            <p className="text-theme-secondary mb-8">When a file is selected, the main view area displays several tabs providing deep insights:</p>

            <div className="space-y-4">
                {[
                    { tab: 'Diagram', desc: 'A high-fidelity read-only preview of the EPC model.' },
                    { tab: 'Overview', desc: 'Metadata details including Author, Creation Date, and Status (Approved/Draft).' },
                    { tab: 'Table', desc: 'A flattened spreadsheet view of all nodes and their attributes.' },
                    { tab: 'History', desc: 'A detailed audit trail of every saved version and changelog entry.' },
                ].map((t, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl border border-theme-border hover:bg-theme-input transition-colors">
                        <span className="w-24 font-bold text-theme-accent text-sm uppercase tracking-tight">{t.tab}</span>
                        <span className="text-theme-secondary text-sm leading-relaxed">{t.desc}</span>
                    </div>
                ))}
            </div>
        </section>
    </div>
);

const FolderMgmtContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-6 tracking-tight">Working with Folders</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Manage your process hierarchy with right-click actions and context-aware tools.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">The Context Menu</h2>
            <p className="text-theme-secondary mb-8 leading-relaxed">
                Right-click any folder in the Explorer tree to access the management toolkit.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                    { action: 'New Folder', desc: 'Creates a nested subgroup under the selected item.' },
                    { action: 'New Process', desc: 'Initializes a blank EPC diagram and opens the Modeler.' },
                    { action: 'Rename', desc: 'Opens a modal to safely update the folder label without breaking links.' },
                    { action: 'Delete', desc: 'Removes the folder and all its contents. Use with caution.' },
                ].map((item, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-app-surface border border-theme-border shadow-sm">
                        <h4 className="font-bold text-theme-primary mb-2">{item.action}</h4>
                        <p className="text-[13px] text-theme-secondary leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        </section>

        <Note>
            Folders named **"Approved"** or models set to **"Approved"** status may be restricted. You cannot create or modify items within a finalized governance state without administrator permission.
        </Note>
    </div>
);

const CreateDiagramContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-4 tracking-tight">Create a Diagram</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed font-medium">Initialize new EPC processes within the designated Workspace area.</p>

        <div className="space-y-12 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-[2px] before:bg-theme-border">
            <Step number="1" title="Locate Workspace Folder">
                Expand the tree to find the <span className="font-bold text-theme-primary">Workspace</span> or a sub-folder within it. Creation is generally restricted to these growth-areas.
            </Step>
            <Step number="2" title="Add New Process">
                Right-click the target folder and select <span className="font-black text-theme-accent uppercase tracking-widest text-xs border-b-2 border-theme-accent/20 pb-0.5">New Process</span>.
            </Step>
            <Step number="3" title="Naming conventions">
                Provide a descriptive name. The platform will automatically tag it as **Draft** and assign it a unique tracking ID.
            </Step>
        </div>

        <section className="mt-20 p-8 rounded-3xl bg-app-surface border border-theme-border">
            <h3 className="font-black text-theme-tertiary uppercase tracking-widest text-[11px] mb-4">Technical Note</h3>
            <p className="text-[15px] text-theme-secondary leading-relaxed">
                Diagrams created in the Workspace are private to your organization. They remain in a "Draft" status until submitted for formal review.
            </p>
        </section>
    </div>
);

const AIAssistedContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-4 tracking-tight">AI-Assisted Operations</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Leverage the **Meerana AI Companion** to automate structural tasks and generate process logic.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6 flex items-center gap-2">
                <Cpu className="text-theme-accent" size={24} />
                The AI Companion
            </h2>
            <p className="text-theme-secondary mb-8 leading-relaxed">
                Located at the bottom of the Explorer sidebar, the AI Companion is a context-aware assistant capable of modifying your workspace structure in real-time.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                {[
                    { title: 'Create', desc: '"Create a new folder for Finance" or "New process for Hiring".' },
                    { title: 'Rename', desc: '"Rename the selected item to Onboarding v2".' },
                    { title: 'Delete', desc: '"Delete the folder named Temporary".' },
                ].map((action, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-app-surface border border-theme-border shadow-sm border-b-4 border-b-theme-accent">
                        <h4 className="font-bold text-theme-primary mb-1">{action.title}</h4>
                        <p className="text-xs text-theme-secondary">{action.desc}</p>
                    </div>
                ))}
            </div>
        </section>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-4">Context Awareness</h2>
            <p className="text-theme-secondary leading-relaxed">
                The AI Companion automatically detects which folder or diagram you have selected. If you say "Rename this", it will target your active selection. If no selection is made, it will ask for clarification or search the tree by name.
            </p>
        </section>

        <Tip>
            Use natural language! You can say **"I need a new structure for the Sales department"** and the AI will suggest and create the necessary folders for you.
        </Tip>
    </div>
);

const EditorOverview = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-4 tracking-tight">Editor Overview</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            The Meerana Process Modeler provides a professional-grade interface optimized for business process engineering.
        </p>

        <div className="grid grid-cols-1 gap-10">
            <div className="flex gap-6 items-start border-b border-theme-border pb-8">
                <div className="w-14 h-14 rounded-2xl bg-theme-input flex items-center justify-center shrink-0 font-black text-2xl text-theme-tertiary">01</div>
                <div>
                    <h3 className="text-xl font-bold text-theme-primary mb-2">The Modeling Canvas (The Heart)</h3>
                    <p className="text-theme-secondary leading-relaxed mb-4">
                        The central infinite workspace. It supports advanced interactions including snapping, lasso selection, and dynamic zooming.
                        The canvas is notation-aware, applying specific layout engines for Tasree3, FAD, and Org Charts.
                    </p>
                </div>
            </div>

            <div className="flex gap-6 items-start border-b border-theme-border pb-8">
                <div className="w-14 h-14 rounded-2xl bg-theme-input flex items-center justify-center shrink-0 font-black text-2xl text-theme-tertiary">02</div>
                <div>
                    <h3 className="text-xl font-bold text-theme-primary mb-2">The Explorer (Project Structure)</h3>
                    <p className="text-theme-secondary leading-relaxed mb-4">
                        Typically docked on the left or available via the navigation menu. It allows you to browse processes by department and manage the lifecycle of your diagrams (As-Is vs To-Be).
                    </p>
                </div>
            </div>

            <div className="flex gap-6 items-start">
                <div className="w-14 h-14 rounded-2xl bg-theme-input flex items-center justify-center shrink-0 font-black text-2xl text-theme-tertiary">03</div>
                <div>
                    <h3 className="text-xl font-bold text-theme-primary mb-2">The Properties Panel & Toolbar</h3>
                    <p className="text-theme-secondary leading-relaxed mb-4">
                        Contains contextual tools for formatting, template switching, and metadata editing. Use the toolbar to trigger AI actions, export to PDF/XML, and toggle governance reviews.
                    </p>
                </div>
            </div>
        </div>
    </div>
);

const OpenSaveContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-4 tracking-tight">Open and Save Diagrams</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Manage your process assets with enterprise-grade persistence and versioning.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6 flex items-center gap-2">Saving your Work</h2>
            <div className="space-y-6">
                <Step number="1" title="Manual Save">
                    Click the <span className="font-bold text-theme-primary inline-flex items-center gap-1 border border-theme-border px-2 py-0.5 rounded shadow-sm bg-app-surface"><Paperclip size={14} className="rotate-45" /> Save</span> icon in the top toolbar or press <kbd className="bg-theme-input px-2 py-1 rounded text-xs font-mono">Ctrl + S</kbd>.
                </Step>
                <Step number="2" title="Auto-Save Cloud Sync">
                    The platform periodically syncs your changes to the cloud. Look for the "Saved" status indicator in the top bar.
                </Step>
            </div>
            <Note>
                Only users with **Edit** permissions can save changes to a diagram. If you are in **View Only** mode, the save icon will be disabled.
            </Note>
        </section>

        <section>
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Opening Existing Diagrams</h2>
            <p className="text-theme-secondary mb-6 leading-relaxed">
                Diagrams are opened directly from the **Process Explorer**. Double-click any process entry to launch the modeler.
            </p>
            <Tip>
                You can maintain two versions of a process: **As-Is** (Current State) and **To-Be** (Optimized State). Switch between them using the toggle in the explorer.
            </Tip>
        </section>
    </div>
);

const ShortcutsContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-4 tracking-tight">Editor Toolbar and Keyboard Shortcuts</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Maximize your modeling efficiency with our comprehensive set of professional shortcuts.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">General Shortcuts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { keys: 'Ctrl + S', action: 'Save current diagram' },
                    { keys: 'Ctrl + Z / Y', action: 'Undo / Redo' },
                    { keys: 'Delete', action: 'Remove selected nodes' },
                    { keys: 'Space + Drag', action: 'Pan around canvas' },
                    { keys: 'Ctrl + Scroll', action: 'Zoom in/out' },
                    { keys: 'L', action: 'Trigger Auto-Layout' },
                ].map((s, i) => (
                    <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-theme-input border border-theme-border">
                        <span className="text-theme-secondary font-medium">{s.action}</span>
                        <kbd className="bg-app-surface border border-theme-border px-2 py-1 rounded shadow-sm text-xs font-mono font-bold text-theme-accent">{s.keys}</kbd>
                    </div>
                ))}
            </div>
        </section>

        <Tip>
            Use the **Magic Auto-Layout** (Sparkle Icon) to instantly re-organize messy diagrams into a perfectly aligned flow.
        </Tip>
    </div>
);

const AddConnectContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-4 tracking-tight">Add and Connect Elements</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Capture process logic by dragging elements and defining structural relationships.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Adding Elements</h2>
            <p className="text-theme-secondary mb-6 leading-relaxed">
                Drag nodes from the **Shapes Sidebar** on the left onto the canvas. The editor will automatically apply the appropriate notation style.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border border-theme-border hover:border-theme-accent/50 transition-all">
                    <h3 className="font-bold text-theme-primary mb-2 underline decoration-theme-accent underline-offset-4">Events (Hexagons)</h3>
                    <p className="text-sm text-theme-secondary leading-relaxed">Represents a state or trigger. Every EPC process must start and end with an Event.</p>
                </div>
                <div className="p-6 rounded-2xl border border-theme-border hover:border-emerald-500/50 transition-all">
                    <h3 className="font-bold text-theme-primary mb-2 underline decoration-emerald-500 underline-offset-4">Functions (Rectangles)</h3>
                    <p className="text-sm text-theme-secondary leading-relaxed">Represents an activity or task performable by a human or system.</p>
                </div>
            </div>
        </section>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Connecting Elements</h2>
            <div className="bg-theme-primary text-white p-8 rounded-3xl mb-8">
                <h4 className="font-bold text-theme-accent mb-4 flex items-center gap-2">
                    <AlertCircle size={18} />
                    Logical Connection Rules
                </h4>
                <ul className="space-y-4 text-theme-secondary text-sm">
                    <li className="flex gap-3">
                        <span className="text-theme-accent font-bold">1.</span>
                        <span>Drag from the blue handles on a node to another node to create an edge.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-theme-accent font-bold">2.</span>
                        <span>The standard EPC pattern is **Event {'->'} Function {'->'} Event**.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-theme-accent font-bold">3.</span>
                        <span>Use **Rules (XOR/AND/OR)** to split or join process branches.</span>
                    </li>
                </ul>
            </div>
        </section>
    </div>
);

const MoveChangeContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-4 tracking-tight">Move and Change Elements</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Refine your diagrams by adjusting node positions and editing metadata properties.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Moving Elements</h2>
            <div className="space-y-4">
                <div className="p-4 rounded-xl bg-theme-input border border-theme-border">
                    <p className="text-theme-primary font-medium">Single Selection: Click and drag any node to move it. Edges will automatically re-route.</p>
                </div>
                <div className="p-4 rounded-xl bg-theme-input border border-theme-border">
                    <p className="text-theme-primary font-medium">Lasso Selection: Hold <kbd className="bg-app-surface border border-theme-border px-1 rounded text-xs">Shift</kbd> and drag over multiple nodes to move them as a group.</p>
                </div>
            </div>
        </section>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6 font-black uppercase tracking-tight text-sm">Editing Properties</h2>
            <p className="text-theme-secondary mb-6 leading-relaxed">
                Double-click any node to open the **Properties Panel**. Here you can change labels, assign roles, and link technical documents.
            </p>
        </section>
    </div>
);

const FormatContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-4 tracking-tight">Format Diagrams</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Enhance the visual appeal and clarity of your business processes.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Visual Templates</h2>
            <div className="grid grid-cols-2 gap-4">
                {['Classic', 'Modern', 'Minimal', 'Glass'].map((t, i) => (
                    <div key={i} className="p-6 rounded-2xl border border-theme-border bg-app-surface shadow-sm hover:shadow-md transition-all">
                        <div className="w-full h-2 bg-theme-input rounded mb-4" />
                        <span className="font-bold text-theme-primary">{t} Style</span>
                    </div>
                ))}
            </div>
        </section>

        <Tip>
            Use colors strategically: **Red** for failure paths and **Green** for success paths to make your diagrams instantly readable.
        </Tip>
    </div>
);

const HierarchiesContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-4 tracking-tight">Process Hierarchies</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Organize complex organizational structures by linking high-level value chains to detailed sub-processes.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Linking Diagrams</h2>
            <p className="text-theme-secondary mb-6 leading-relaxed">
                In Meerana Tasree3, you can link a **Function** node to another diagram. This creates a "drill-down" effect, allowing stakeholders to navigate from a bird's eye view to granular technical steps.
            </p>
            <div className="p-6 rounded-3xl bg-theme-accent text-white shadow-xl shadow-indigo-100">
                <h4 className="font-bold mb-2 flex items-center gap-2">How to link:</h4>
                <p className="text-sm text-indigo-100">Right-click a Function {'->'} Linked Diagram {'->'} Select Target. A small link icon will appear on the node.</p>
            </div>
        </section>
    </div>
);

const SubprocessesContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-4 tracking-tight">Sub-processes & FADs</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Function Allocation Diagrams (FADs) provide a 360-degree view of a single process step.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">The FAD View</h2>
            <p className="text-theme-secondary mb-6 leading-relaxed">
                A FAD connects a central Function to its supporting IT Systems, Roles (Who), and Documents (Inputs/Outputs).
            </p>
            <Note>
                FADs are automatically generated when you assign metadata to a Function in the main EPC view.
            </Note>
        </section>
    </div>
);

const ConventionsContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-4 tracking-tight">Modeling Conventions</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Standardize your modeling approach to ensure cross-departmental consistency.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">The Tasree3 Golden Rule</h2>
            <div className="bg-theme-input border-2 border-dashed border-theme-border p-8 rounded-3xl text-center">
                <span className="text-theme-tertiary font-bold block mb-4">MANDATORY SEQUENCE</span>
                <div className="flex items-center justify-center gap-4 text-lg font-black italic">
                    <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg">EVENT</span>
                    <ArrowRight size={20} className="text-theme-tertiary" />
                    <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg">FUNCTION</span>
                    <ArrowRight size={20} className="text-theme-tertiary" />
                    <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg">EVENT</span>
                </div>
            </div>
        </section>
    </div>
);

const WorkflowContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-4 tracking-tight">Review & Approval Workflow</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Meerana Tasree3 enforces strict governance through a sequential multi-stage approval process.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-8 border-b border-theme-border pb-4">The Sequential Chain</h2>
            <div className="grid grid-cols-1 gap-6">
                <div className="p-8 rounded-[2rem] border border-theme-border bg-app-surface shadow-sm relative overflow-hidden group">
                    <div className="flex gap-6 items-start">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-theme-accent flex items-center justify-center shrink-0">
                            <ArrowRight size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-theme-primary tracking-tight text-lg mb-2">Sequential Reviewer Chain</h4>
                            <p className="text-theme-secondary leading-relaxed text-[15px]">When submitting a process, you define an ordered list of reviewers. The platform automatically routes the task to the next reviewer only after current approval is granted.</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 rounded-[2rem] border border-theme-border bg-app-surface shadow-sm relative overflow-hidden group">
                    <div className="flex gap-6 items-start">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-theme-primary tracking-tight text-lg mb-2">Final Approval</h4>
                            <p className="text-theme-secondary leading-relaxed text-[15px]">The ultimate "Released" state can only be granted by the designated Final Approver. Once approved, the model is versioned and locked.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section className="bg-app-surface p-8 rounded-3xl border border-theme-border">
            <h3 className="font-black text-theme-tertiary uppercase tracking-widest text-[10px] mb-4">Rejection Handling</h3>
            <p className="text-theme-secondary text-[14px] leading-relaxed italic">
                "If any reviewer or the approver rejects the model, it returns to the Designer as a **Draft** with mandatory rejection comments to guide corrections."
            </p>
        </section>
    </div>
);

const OrgMgmtContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-4 tracking-tight">Organization Management</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">Administration portal for Managers to govern users and branding.</p>

        <section className="mb-12 space-y-12">
            <Step number="1" title="User Provisioning">
                Add new team members by providing their business email and assigning a role (Viewer, Designer, Manager).
            </Step>
            <Step number="2" title="Branding Controls">
                Upload your enterprise logo to personalize the workspace and PDF exports. The logo is automatically scaled for headers.
            </Step>
            <Step number="3" title="Access Control">
                Update or revoke user access instantly. Deleted users will immediately lose session connectivity.
            </Step>
        </section>

        <Caution>
            Deleting an Organization or revoking a Manager-level user is an irreversible action. Ensure all critical assets are exported via **Reporting & Export** before proceeding.
        </Caution>

        <section className="mt-20 p-8 rounded-[2.5rem] bg-app-surface border border-theme-border">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">PDF Configuration</h2>
            <p className="text-theme-secondary mb-8 leading-relaxed">
                Managers can customize the automated report generation by defining headers and footers. Use the following placeholders for dynamic content:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                    { token: '{{org_name}}', desc: 'Displays your organization name.' },
                    { token: '{{process_name}}', desc: 'Displays the active diagram name.' },
                    { token: '{{date}}', desc: 'The date of report generation.' },
                    { token: '{{page_number}}', desc: 'Sequential page numbering (Footer).' },
                ].map((item, i) => (
                    <div key={i} className="p-4 rounded-xl bg-theme-input border border-theme-border flex items-start gap-4">
                        <code className="text-theme-accent font-bold text-xs shrink-0">{item.token}</code>
                        <span className="text-xs text-theme-secondary">{item.desc}</span>
                    </div>
                ))}
            </div>
        </section>
    </div>
);

const ReportingExportContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-4 tracking-tight">Reporting & Export</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Generate high-fidelity documentation and exchange process data across platforms.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">PDF Report Generation</h2>
            <p className="text-theme-secondary mb-6 leading-relaxed">
                Export your diagrams to professional PDF documents directly from the editor toolbar. The platform supports several layout optimizations:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border border-theme-border bg-app-surface">
                    <h4 className="font-bold text-theme-primary mb-2">Standard Formats</h4>
                    <p className="text-sm text-theme-secondary">Choose between **A4** (Vertical) or **A3** (Horizontal) for standardized technical documents.</p>
                </div>
                <div className="p-6 rounded-2xl border border-theme-border bg-app-surface">
                    <h4 className="font-bold text-theme-primary mb-2">Original Size</h4>
                    <p className="text-sm text-theme-secondary">Exports the canvas at its native resolution, ideal for large-scale value chains.</p>
                </div>
            </div>
            <div className="mt-8 p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                <p className="text-sm text-theme-secondary leading-relaxed">
                    The PDF engine automatically injects your organization branding, headers, and footers as configured in the **Admin Dashboard**.
                </p>
            </div>
        </section>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Data Exchange (XML)</h2>
            <p className="text-theme-secondary mb-6 leading-relaxed">
                Meerana Tasree3 supports bi-directional XML exchange, allowing you to migrate processes between different BPM suites or perform advanced offline analysis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 p-6 rounded-2xl bg-theme-input border border-theme-border">
                    <h4 className="font-bold text-theme-primary mb-1">Export XML</h4>
                    <p className="text-xs text-theme-secondary">Downloads the semantic structure and metadata of your diagram.</p>
                </div>
                <div className="flex-1 p-6 rounded-2xl bg-theme-input border border-theme-border">
                    <h4 className="font-bold text-theme-primary mb-1">Import XML</h4>
                    <p className="text-xs text-theme-secondary">Upload external process definitions to recreate models instantly.</p>
                </div>
            </div>
        </section>
    </div>
);

const MetaTemplatesContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-4 tracking-tight">Meta Node Templates</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed font-medium">Standardize organizational data capture beyond the visual diagram.</p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Global Standard Injection</h2>
            <p className="text-theme-secondary leading-relaxed mb-8">
                Managers can define "Meta Templates" for specific node types. For example, you can mandate that every "Risk" node in your organization must capture "Impact" and "Probability" fields.
            </p>

            <div className="p-8 rounded-[2.5rem] bg-theme-primary text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <h4 className="text-theme-accent/70 font-bold uppercase tracking-widest text-xs mb-4">Functional Workflow</h4>
                    <p className="text-lg leading-relaxed mb-6 italic">"Define once in the Management Dashboard, and the fields are automatically injected into the **Overview** panel for every Designer in your organization."</p>
                </div>
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full -mb-24 -mr-24" />
            </div>
        </section>
    </div>
);

const ProfileSettingsContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-4 tracking-tight">Profile & Preferences</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">Personalize your Meerana EPC environment.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl border border-theme-border bg-app-surface">
                <h3 className="font-bold text-theme-primary mb-3">Language (i18n)</h3>
                <p className="text-sm text-theme-secondary leading-relaxed">Switch seamlessly between **English** and **Arabic**. The entire UI, including RTL support, updates instantly.</p>
            </div>
            <div className="p-8 rounded-3xl border border-theme-border bg-app-surface">
                <h3 className="font-bold text-theme-primary mb-3">Theme Core</h3>
                <p className="text-sm text-theme-secondary leading-relaxed">Toggle between **Light Mode** (Paper-like) and **Dark Mode** (OLED-optimized) for comfortable modeling.</p>
            </div>
        </div>
    </div>
);

const BPMNModelingContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-6 tracking-tight">BPMN 2.0 Modeling</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Tasree3 now supports the **Business Process Model and Notation (BPMN) 2.0** standard alongside EPC, providing a globally recognized language for process documentation.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Core BPMN Elements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="p-6 rounded-2xl border border-theme-border bg-app-surface shadow-sm">
                    <h4 className="font-bold text-theme-accent mb-2">Pools & Lanes</h4>
                    <p className="text-sm text-theme-tertiary leading-relaxed">Organize tasks by participants or departments using dynamic swimlanes.</p>
                </div>
                <div className="p-6 rounded-2xl border border-theme-border bg-app-surface shadow-sm">
                    <h4 className="font-bold text-theme-accent mb-2">Gateways</h4>
                    <p className="text-sm text-theme-tertiary leading-relaxed">Model complex logic with Exclusive (XOR), Parallel (AND), and Inclusive (OR) gateways.</p>
                </div>
                <div className="p-6 rounded-2xl border border-theme-border bg-app-surface shadow-sm">
                    <h4 className="font-bold text-theme-accent mb-2">Events</h4>
                    <p className="text-sm text-theme-tertiary leading-relaxed">Trigger processes with Start, Intermediate, and End events (Timer, Message, Signal).</p>
                </div>
                <div className="p-6 rounded-2xl border border-theme-border bg-app-surface shadow-sm">
                    <h4 className="font-bold text-theme-accent mb-2">Activities</h4>
                    <p className="text-sm text-theme-tertiary leading-relaxed">Define User Tasks, Service Tasks, and Call Activities with detailed properties.</p>
                </div>
            </div>
        </section>

        <Tip>
            You can convert EPC logic into BPMN structures using the AI-assisted modeler to maintain consistency across different modeling standards.
        </Tip>
    </div>
);

const SmartLayoutContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-6 tracking-tight">Smart Layout Engine</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Clean up messy diagrams instantly with our high-performance Dagre-based layout engine.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">How it Works</h2>
            <div className="space-y-6">
                <Step number="1" title="Select Orientation">
                    Choose between **Top-to-Bottom** (standard for EPC) or **Left-to-Right** (common for BPMN).
                </Step>
                <Step number="2" title="Auto-Alignment">
                    The engine calculates the optimal path for connectors, eliminating overlaps and ensuring a professional hierarchy.
                </Step>
                <Step number="3" title="Fine-tuning">
                    After the auto-layout, you can still manually adjust nodes while the connectors maintain their smart routing.
                </Step>
            </div>
        </section>

        <Note>
            Smart Layout is particularly useful when generating diagrams from Process Mining logs or AI text prompts, where manual positioning would be time-consuming.
        </Note>
    </div>
);

const MiningOverviewContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-6 tracking-tight">Process Mining Overview</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Discover your **real** business processes by analyzing event logs from your enterprise systems (ERP, CRM, etc.).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-center">
                <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                    <Activity size={24} />
                </div>
                <h4 className="font-bold text-theme-primary mb-2">Discovery</h4>
                <p className="text-xs text-theme-tertiary">Visualize the actual flow of work from data.</p>
            </div>
            <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                    <Target size={24} />
                </div>
                <h4 className="font-bold text-theme-primary mb-2">Conformance</h4>
                <p className="text-xs text-theme-tertiary">Compare actual vs. designed processes.</p>
            </div>
            <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-center">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                    <Cpu size={24} />
                </div>
                <h4 className="font-bold text-theme-primary mb-2">Enhancement</h4>
                <p className="text-xs text-theme-tertiary">Identify bottlenecks and AI-driven optimizations.</p>
            </div>
        </div>
    </div>
);

const LogUploadContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-6 tracking-tight">Uploading Event Logs</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Tasree3 supports structured data ingestion for process discovery.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Required Data Fields</h2>
            <p className="text-theme-secondary mb-6">To generate a process map, your CSV or JSON file must contain at least:</p>
            <div className="overflow-hidden rounded-xl border border-theme-border bg-app-surface mb-8">
                <table className="w-full text-left text-sm">
                    <thead className="bg-theme-bg-tertiary/50 text-xs font-bold uppercase text-theme-tertiary">
                        <tr>
                            <th className="px-6 py-3">Field Name</th>
                            <th className="px-6 py-3">Description</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border text-theme-secondary">
                        <tr>
                            <td className="px-6 py-4 font-mono font-bold text-theme-accent">Case ID</td>
                            <td className="px-6 py-4">Unique identifier for a single process instance (e.g., Order #).</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 font-mono font-bold text-theme-accent">Activity</td>
                            <td className="px-6 py-4">The name of the task or event performed.</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 font-mono font-bold text-theme-accent">Timestamp</td>
                            <td className="px-6 py-4">When the activity started or ended (ISO 8601 format).</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <Note>
            You can also include optional fields like **Resource** (User performing the task) or **Cost** for advanced performance analysis.
        </Note>
    </div>
);

const ProcessDiscoveryContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-6 tracking-tight">Discovery & Maps</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Once uploaded, Tasree3 transforms raw logs into interactive process maps.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Visualization Modes</h2>
            <div className="space-y-6">
                <div className="p-6 rounded-2xl border border-theme-border bg-app-surface">
                    <h4 className="font-bold text-theme-primary mb-2 flex items-center gap-2">
                        <Activity size={18} className="text-indigo-500" />
                        Frequency View
                    </h4>
                    <p className="text-sm text-theme-secondary leading-relaxed">Shows the "Happy Path" and most common variants. Thicker lines indicate more frequent transitions between activities.</p>
                </div>
                <div className="p-6 rounded-2xl border border-theme-border bg-app-surface">
                    <h4 className="font-bold text-theme-primary mb-2 flex items-center gap-2">
                        <Activity size={18} className="text-rose-500" />
                        Performance View
                    </h4>
                    <p className="text-sm text-theme-secondary leading-relaxed">Highlight bottlenecks. Connections are colored by throughput time—red lines indicate significant delays in the process flow.</p>
                </div>
            </div>
        </section>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">KPI Dashboard</h2>
            <p className="text-theme-secondary mb-6">Real-time metrics calculated from your logs:</p>
            <ul className="grid grid-cols-2 gap-4">
                <li className="p-4 bg-theme-input rounded-xl text-sm font-bold text-theme-primary">Total Case Volume</li>
                <li className="p-4 bg-theme-input rounded-xl text-sm font-bold text-theme-primary">Avg. Throughput Time</li>
                <li className="p-4 bg-theme-input rounded-xl text-sm font-bold text-theme-primary">Unique Variant Count</li>
                <li className="p-4 bg-theme-input rounded-xl text-sm font-bold text-theme-primary">Primary Bottleneck Identification</li>
            </ul>
        </section>
    </div>
);

const ConformanceCheckingContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-6 tracking-tight">Conformance Checking</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Audit compliance by comparing discovered reality against your designed "To-Be" models.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Detecting Deviations</h2>
            <p className="text-theme-secondary mb-6 leading-relaxed">
                The conformance engine identifies three types of discrepancies:
            </p>
            <div className="space-y-4">
                <div className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0 mt-1"><X size={14} /></div>
                    <div>
                        <h4 className="font-bold text-theme-primary text-sm">Skipped Activities</h4>
                        <p className="text-xs text-theme-tertiary">Mandatory steps in your model that were not performed in reality.</p>
                    </div>
                </div>
                <div className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-1"><Activity size={14} /></div>
                    <div>
                        <h4 className="font-bold text-theme-primary text-sm">Unexpected Activities</h4>
                        <p className="text-xs text-theme-tertiary">Work being done that isn't documented in the official process model.</p>
                    </div>
                </div>
                <div className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 mt-1"><ArrowRight size={14} /></div>
                    <div>
                        <h4 className="font-bold text-theme-primary text-sm">Wrong Sequence</h4>
                        <p className="text-xs text-theme-tertiary">Activities performed in an order that violates business rules or logic.</p>
                    </div>
                </div>
            </div>
        </section>

        <Tip>
            Use Conformance results to justify process model updates or to trigger internal audit reviews for non-compliant departments.
        </Tip>
    </div>
);

const AIMiningInsightsContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-6 tracking-tight">AI Mining Insights</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed font-medium">
            Let the Tasree3 AI Analyst interpret your process data for you.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Interactive AI Chat</h2>
            <p className="text-theme-secondary mb-6 leading-relaxed">
                Open the **AI Analyst** panel within the Mining Dashboard to ask natural language questions about your data:
            </p>
            <div className="p-6 rounded-2xl bg-theme-primary text-white space-y-3 mb-10 shadow-xl">
                <p className="text-sm opacity-70 font-mono">Suggested Prompts:</p>
                <p className="text-lg font-bold italic">"What is the main cause of delays in the 'Procurement' phase?"</p>
                <p className="text-lg font-bold italic">"Which department has the highest rework rate?"</p>
                <p className="text-lg font-bold italic">"Summarize the top 3 inefficiencies found in this log."</p>
            </div>
        </section>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Automated Root Cause Analysis</h2>
            <p className="text-theme-secondary leading-relaxed">
                The AI automatically scans for correlations between data attributes (like Vendor, Region, or Product Type) and process delays, highlighting precisely where to focus your improvement efforts.
            </p>
        </section>
    </div>
);

const CustomAttributesContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-6 tracking-tight">Advanced Custom Attributes</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Go beyond standard modeling by capturing organization-specific metadata for every process node.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Dynamic Data Types</h2>
            <p className="text-theme-secondary mb-8">Managers can now define complex data fields in the **Attributes Setup** tab:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                <div className="p-4 rounded-xl border border-theme-border bg-app-surface flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">List</div>
                    <span className="text-sm font-bold text-theme-primary">Pre-defined Dropdowns</span>
                </div>
                <div className="p-4 rounded-xl border border-theme-border bg-app-surface flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">Dict</div>
                    <span className="text-sm font-bold text-theme-primary">Dictionary Key-Value Pairs</span>
                </div>
                <div className="p-4 rounded-xl border border-theme-border bg-app-surface flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">Date</div>
                    <span className="text-sm font-bold text-theme-primary">Custom Date Formats</span>
                </div>
                <div className="p-4 rounded-xl border border-theme-border bg-app-surface flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">Check</div>
                    <span className="text-sm font-bold text-theme-primary">Boolean Constraints</span>
                </div>
            </div>
        </section>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Scoping & Governance</h2>
            <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-app-surface border border-theme-border">
                    <h4 className="font-bold text-theme-primary mb-1">Diagram-Specific Scope</h4>
                    <p className="text-sm text-theme-secondary leading-relaxed">Limit certain attributes to a single process rather than applying them organization-wide.</p>
                </div>
                <div className="p-6 rounded-2xl bg-app-surface border border-theme-border">
                    <h4 className="font-bold text-theme-primary mb-1">Bulk Management</h4>
                    <p className="text-sm text-theme-secondary leading-relaxed">Select multiple attributes to delete or update their symbol set mapping in a single action.</p>
                </div>
            </div>
        </section>
    </div>
);

const AIAnalyticsAdminContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-6 tracking-tight">AI Usage & Cost Analytics</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Full observability into your organization's AI consumption and operational efficiency.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Intelligence Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="p-8 rounded-3xl border border-theme-border bg-app-surface shadow-sm">
                    <h4 className="font-black text-theme-primary mb-3">Cost Tracking</h4>
                    <p className="text-theme-secondary text-sm leading-relaxed">Real-time estimation of tokens used and actual cost in **USD**, **AED**, or **INR**.</p>
                </div>
                <div className="p-8 rounded-3xl border border-theme-border bg-app-surface shadow-sm">
                    <h4 className="font-black text-theme-primary mb-3">Performance Monitoring</h4>
                    <p className="text-theme-secondary text-sm leading-relaxed">Track average latency and request success rates across all AI-enabled features.</p>
                </div>
            </div>
        </section>

        <Note>
            Admins can export an **Ops Report** as a CSV to perform deeper billing analysis or to allocate costs back to internal departments.
        </Note>
    </div>
);

const PDFBrandingContent = () => (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-6 tracking-tight">PDF Branding Control</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed font-medium">
            Ensure all exported process documentation adheres to your corporate identity.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Advanced PDF Settings</h2>
            <div className="space-y-6">
                <Step number="1" title="Dynamic Headers & Footers">
                    Use variables like `[org_name]`, `[process_name]`, and `[date]` to automatically populate page metadata.
                </Step>
                <Step number="2" title="Logo Integration">
                    Toggle corporate logo visibility on every page of the generated documentation.
                </Step>
                <Step number="3" title="Watermarking">
                    Enable global watermarks (e.g., "CONFIDENTIAL") to protect sensitive process information.
                </Step>
            </div>
        </section>
    </div>
);

const AuditContent = () => (

    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-theme-primary mb-4 tracking-tight">Audit Trail & History</h1>
        <p className="text-xl text-theme-secondary mb-10 leading-relaxed">
            Track every change, comment, and approval in your process lifecycle.
        </p>

        <section className="mb-12">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Viewing History</h2>
            <p className="text-theme-secondary mb-6 leading-relaxed">
                Click **View History** in the explorer to see a timestamped log of modifications. The audit trail includes user IDs, change summaries, and approval notes.
            </p>
        </section>
    </div>
);

const DefaultContent = () => (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-2xl mx-auto">
        <HelpCircle size={64} className="text-theme-tertiary/50 mb-4" />
        <h2 className="text-2xl font-bold text-theme-primary">Choose a topic to begin</h2>
        <p className="text-theme-secondary mt-2">Explore our comprehensive guides to mastering the Meerana EPC BPM platform.</p>
    </div>
);

export default function HelpContent({ activeTopic }) {
    const renderContent = () => {
        switch (activeTopic) {
            case 'welcome': return <WelcomeContent />;
            case 'sign-up': return <SignUpContent />;
            case 'login': return <LoginContent />;
            case 'user-roles': return <UserRolesContent />;
            case 'nav-bar': return <NavBarContent />;
            case 'workspace-overview': return <WorkspaceOverviewContent />;
            case 'explorer-menu': return <ExplorerMenuContent />;
            case 'diagram-details': return <DiagramDetailsContent />;
            case 'folder-mgmt': return <FolderMgmtContent />;
            case 'create-diagram': return <CreateDiagramContent />;
            case 'ai-assisted': return <AIAssistedContent />;
            case 'bpmn-modeling': return <BPMNModelingContent />;
            case 'smart-layout': return <SmartLayoutContent />;
            case 'editor-overview': return <EditorOverview />;
            case 'mining-overview': return <MiningOverviewContent />;
            case 'log-upload': return <LogUploadContent />;
            case 'process-discovery': return <ProcessDiscoveryContent />;
            case 'conformance-checking': return <ConformanceCheckingContent />;
            case 'ai-mining-insights': return <AIMiningInsightsContent />;
            case 'open-save': return <OpenSaveContent />;
            case 'shortcuts': return <ShortcutsContent />;
            case 'add-connect': return <AddConnectContent />;
            case 'move-change': return <MoveChangeContent />;
            case 'format': return <FormatContent />;
            case 'hierarchies': return <HierarchiesContent />;
            case 'subprocesses': return <SubprocessesContent />;
            case 'conventions': return <ConventionsContent />;
            case 'workflow': return <WorkflowContent />;
            case 'reporting-export': return <ReportingExportContent />;
            case 'audit': return <AuditContent />;
            case 'org-mgmt': return <OrgMgmtContent />;
            case 'custom-attributes': return <CustomAttributesContent />;
            case 'ai-analytics-admin': return <AIAnalyticsAdminContent />;
            case 'pdf-branding': return <PDFBrandingContent />;
            case 'meta-templates': return <MetaTemplatesContent />;
            case 'profile-settings': return <ProfileSettingsContent />;
            default: return <DefaultContent />;
        }
    };

    return (
        <div className="min-h-full transition-colors duration-300">
            {renderContent()}

            {/* Quick Feedback Widget */}
            <div className="mt-32 pt-16 border-t border-theme-border flex flex-col md:flex-row items-center justify-between gap-8 pb-20">
                <div>
                    <h4 className="text-xl font-bold text-theme-primary mb-2">Was this helpful?</h4>
                    <p className="text-theme-secondary text-sm">Help us improve the Meerana EPC documentation.</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-3 rounded-2xl border border-theme-border hover:bg-theme-input transition-all font-bold text-sm text-theme-primary flex items-center gap-2">
                        <CheckCircle size={18} className="text-emerald-500" />
                        Yes, it was!
                    </button>
                    <button className="px-6 py-3 rounded-2xl border border-theme-border hover:bg-theme-input transition-all font-bold text-sm text-theme-primary flex items-center gap-2">
                        <AlertCircle size={18} className="text-rose-500" />
                        Still confused
                    </button>
                </div>
            </div>
        </div>
    );
}
