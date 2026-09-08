import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  ClipboardList,
  FileText,
  FlaskConical,
  Gauge,
  HeartPulse,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Pill,
  ScrollText,
  Settings,
  ShieldAlert,
  Stethoscope,
  Users,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  /** finding-count badge source */
  badge?: 'critical' | 'openInbox' | 'myTasks';
}

export interface NavSection {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

export const NAV: NavSection[] = [
  {
    id: 'command',
    label: 'Command Center',
    icon: LayoutDashboard,
    items: [
      { label: 'Clinical Risk Command Center', to: '/dashboard' },
      { label: 'Clinical Risk Dashboard', to: '/dashboard/analytics' },
    ],
  },
  {
    id: 'mywork',
    label: 'My Work',
    icon: ListChecks,
    items: [
      { label: 'My Patients', to: '/my/patients' },
      { label: 'My Tasks', to: '/my/tasks', badge: 'myTasks' },
      { label: 'My Documentation', to: '/my/documentation' },
      { label: 'My Risk Findings', to: '/my/findings' },
    ],
  },
  {
    id: 'risk',
    label: 'Risk Management',
    icon: ShieldAlert,
    items: [
      { label: 'Risk Inbox', to: '/risk/inbox', badge: 'openInbox' },
      { label: 'Critical Findings', to: '/risk/critical', badge: 'critical' },
      { label: 'Overdue Findings', to: '/risk/overdue' },
      { label: 'Aging Findings', to: '/risk/aging' },
      { label: 'Resolved Findings', to: '/risk/resolved' },
      { label: 'Exceptions', to: '/risk/exceptions' },
      { label: 'False Positive Review', to: '/risk/false-positives' },
      { label: 'Risk Rules', to: '/risk/rules' },
    ],
  },
  {
    id: 'patients',
    label: 'Patients',
    icon: Users,
    items: [
      { label: 'Patient Directory', to: '/patients' },
      { label: 'Admissions', to: '/patients?status=admitted' },
      { label: 'Current Patients', to: '/patients?status=current' },
      { label: 'Discharges', to: '/patients?status=discharged' },
    ],
  },
  {
    id: 'clinical',
    label: 'Clinical',
    icon: Stethoscope,
    items: [
      { label: 'Notes', to: '/clinical/notes' },
      { label: 'Assessments', to: '/clinical/assessments' },
      { label: 'Care Plans', to: '/clinical/care-plans' },
      { label: 'Medications', to: '/clinical/medications' },
      { label: 'MAR', to: '/clinical/mar' },
      { label: 'Orders', to: '/clinical/orders' },
      { label: 'Labs', to: '/clinical/labs' },
      { label: 'Vitals', to: '/clinical/vitals' },
      { label: 'Documents', to: '/clinical/documents' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: Gauge,
    items: [
      { label: 'Compliance Overview', to: '/analytics/compliance' },
      { label: 'Facility Performance', to: '/analytics/facility' },
      { label: 'Unit Performance', to: '/analytics/unit' },
      { label: 'Staff Performance', to: '/analytics/staff' },
      { label: 'Risk Trends', to: '/analytics/trends' },
      { label: 'Reports', to: '/reports' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: Settings,
    items: [
      { label: 'Users', to: '/admin/users' },
      { label: 'Roles & Permissions', to: '/admin/roles' },
      { label: 'Facilities', to: '/admin/facilities' },
      { label: 'Units', to: '/admin/units' },
      { label: 'Clinical Templates', to: '/admin/templates' },
      { label: 'Rule Configuration', to: '/risk/rules' },
      { label: 'Notification Settings', to: '/admin/notifications' },
      { label: 'Audit Logs', to: '/admin/audit' },
      { label: 'AI Governance', to: '/admin/ai-governance' },
      { label: 'System Settings', to: '/admin/settings' },
    ],
  },
];

// icons re-exported for incidental use
export const ICONS = {
  Activity,
  ClipboardList,
  FileText,
  FlaskConical,
  HeartPulse,
  Inbox,
  Pill,
  ScrollText,
};
