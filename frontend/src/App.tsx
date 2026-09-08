import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { LoginPage } from '@/pages/Login';
import { CommandCenter } from '@/features/dashboard/CommandCenter';
import { RiskAnalytics } from '@/features/dashboard/RiskAnalytics';
import { RiskInbox } from '@/features/risk/RiskInbox';
import { FindingDetailPage } from '@/features/risk/FindingDetailPage';
import { ExceptionsPage } from '@/features/risk/ExceptionsPage';
import { FalsePositivesPage } from '@/features/risk/FalsePositivesPage';
import { RuleListPage } from '@/features/risk/RuleListPage';
import { RuleBuilderPage } from '@/features/risk/RuleBuilderPage';
import { PatientDirectory } from '@/features/patients/PatientDirectory';
import { Patient360 } from '@/features/patients/Patient360';
import {
  OverviewTab,
  TimelineTab,
  NotesTab,
  AssessmentsTab,
  CarePlanTab,
  MedicationsTab,
  MarTab,
  OrdersTab,
  LabsTab,
  VitalsTab,
  RiskComplianceTab,
  AuditHistoryTab,
  AskTheChartTab,
  DocumentsTab,
} from '@/features/patients/tabs';
import { NoteEditorPage } from '@/features/notes/NoteEditorPage';
import { MedicationReconciliationPage } from '@/features/medications/MedicationReconciliationPage';
import {
  NotesListPage,
  AssessmentsListPage,
  CarePlansListPage,
  MedicationsListPage,
  MarListPage,
  OrdersListPage,
  LabsListPage,
  VitalsListPage,
  DocumentsListPage,
} from '@/features/clinical/ClinicalListPages';
import {
  ComplianceOverviewPage,
  FacilityPerformancePage,
  UnitPerformancePage,
  StaffPerformancePage,
  RiskTrendsPage,
} from '@/features/analytics/AnalyticsPages';
import { ReportLibraryPage } from '@/features/reports/ReportLibraryPage';
import { ReportViewerPage } from '@/features/reports/ReportViewerPage';
import {
  UsersPage,
  RolesPage,
  FacilitiesPage,
  UnitsPage,
  TemplatesPage,
  NotificationSettingsPage,
  AuditLogsPage,
  AIGovernancePage,
  SystemSettingsPage,
} from '@/features/admin/AdminPages';
import { MyPatientsPage, MyTasksPage, MyDocumentationPage, MyFindingsPage } from '@/features/mywork/MyWorkPages';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<CommandCenter />} />
        <Route path="/dashboard/analytics" element={<RiskAnalytics />} />

        {/* My Work */}
        <Route path="/my/patients" element={<MyPatientsPage />} />
        <Route path="/my/tasks" element={<MyTasksPage />} />
        <Route path="/my/documentation" element={<MyDocumentationPage />} />
        <Route path="/my/findings" element={<MyFindingsPage />} />

        {/* Risk */}
        <Route path="/risk/inbox" element={<RiskInbox key="inbox" preset="all" />} />
        <Route path="/risk/critical" element={<RiskInbox key="critical" preset="critical" />} />
        <Route path="/risk/overdue" element={<RiskInbox key="overdue" preset="overdue" />} />
        <Route path="/risk/aging" element={<RiskInbox key="aging" preset="aging" />} />
        <Route path="/risk/resolved" element={<RiskInbox key="resolved" preset="resolved" />} />
        <Route path="/risk/exceptions" element={<ExceptionsPage />} />
        <Route path="/risk/false-positives" element={<FalsePositivesPage />} />
        <Route path="/risk/rules" element={<RuleListPage />} />
        <Route path="/risk/rules/new" element={<RuleBuilderPage />} />
        <Route path="/risk/rules/:ruleId" element={<RuleBuilderPage />} />
        <Route path="/risk/findings/:findingId" element={<FindingDetailPage />} />

        {/* Patients */}
        <Route path="/patients" element={<PatientDirectory />} />
        <Route path="/patients/:patientId" element={<Patient360 />}>
          <Route index element={<OverviewTab />} />
          <Route path="timeline" element={<TimelineTab />} />
          <Route path="notes" element={<NotesTab />} />
          <Route path="notes/:noteId" element={<NoteEditorPage />} />
          <Route path="assessments" element={<AssessmentsTab />} />
          <Route path="care-plan" element={<CarePlanTab />} />
          <Route path="medications" element={<MedicationsTab />} />
          <Route path="medications/reconciliation" element={<MedicationReconciliationPage />} />
          <Route path="mar" element={<MarTab />} />
          <Route path="orders" element={<OrdersTab />} />
          <Route path="labs" element={<LabsTab />} />
          <Route path="vitals" element={<VitalsTab />} />
          <Route path="documents" element={<DocumentsTab />} />
          <Route path="risk" element={<RiskComplianceTab />} />
          <Route path="ask" element={<AskTheChartTab />} />
          <Route path="audit" element={<AuditHistoryTab />} />
        </Route>

        {/* Clinical global lists */}
        <Route path="/clinical/notes" element={<NotesListPage />} />
        <Route path="/clinical/assessments" element={<AssessmentsListPage />} />
        <Route path="/clinical/care-plans" element={<CarePlansListPage />} />
        <Route path="/clinical/medications" element={<MedicationsListPage />} />
        <Route path="/clinical/mar" element={<MarListPage />} />
        <Route path="/clinical/orders" element={<OrdersListPage />} />
        <Route path="/clinical/labs" element={<LabsListPage />} />
        <Route path="/clinical/vitals" element={<VitalsListPage />} />
        <Route path="/clinical/documents" element={<DocumentsListPage />} />

        {/* Analytics */}
        <Route path="/analytics/compliance" element={<ComplianceOverviewPage />} />
        <Route path="/analytics/facility" element={<FacilityPerformancePage />} />
        <Route path="/analytics/unit" element={<UnitPerformancePage />} />
        <Route path="/analytics/staff" element={<StaffPerformancePage />} />
        <Route path="/analytics/trends" element={<RiskTrendsPage />} />
        <Route path="/reports" element={<ReportLibraryPage />} />
        <Route path="/reports/:reportId" element={<ReportViewerPage />} />

        {/* Admin */}
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/admin/roles" element={<RolesPage />} />
        <Route path="/admin/facilities" element={<FacilitiesPage />} />
        <Route path="/admin/units" element={<UnitsPage />} />
        <Route path="/admin/templates" element={<TemplatesPage />} />
        <Route path="/admin/notifications" element={<NotificationSettingsPage />} />
        <Route path="/admin/audit" element={<AuditLogsPage />} />
        <Route path="/admin/ai-governance" element={<AIGovernancePage />} />
        <Route path="/admin/settings" element={<SystemSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
