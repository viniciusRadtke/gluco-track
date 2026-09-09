import { createBrowserRouter } from 'react-router'

import { AppShell } from '@/components/layout/app-shell'
import { ChartsPage } from '@/pages/charts-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { ExamsPage } from '@/pages/exams-page'
import { HistoryPage } from '@/pages/history-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { RecordPage } from '@/pages/record-page'
import { ReportPage } from '@/pages/report-page'
import { SettingsPage } from '@/pages/settings-page'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppShell,
    children: [
      { index: true, Component: DashboardPage },
      { path: 'registrar', Component: RecordPage },
      { path: 'historico', Component: HistoryPage },
      { path: 'graficos', Component: ChartsPage },
      { path: 'exames', Component: ExamsPage },
      { path: 'relatorio', Component: ReportPage },
      { path: 'configuracoes', Component: SettingsPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
])
