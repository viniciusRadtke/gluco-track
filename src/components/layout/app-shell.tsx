import { Outlet, useLocation } from 'react-router'

import { allNavItems } from '@/app/navigation'
import { BottomNav } from './bottom-nav'
import { SideNav } from './side-nav'

function usePageTitle() {
  const { pathname } = useLocation()
  return allNavItems.find((item) => item.to === pathname)?.label ?? 'GlucoTrack'
}

export function AppShell() {
  const title = usePageTitle()

  return (
    <div className="min-h-dvh">
      <SideNav />

      <div className="lg:pl-64">
        {/*
          The header carries the page title and nothing else. The theme control
          lives on Configurações (RF-CFG-04), where it is looked for; on every
          other screen it was a second control competing with the content.
        */}
        <header className="border-border-base bg-surface/85 sticky top-0 z-20 border-b backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-3xl items-center px-4">
            <h1 className="text-text truncate text-lg font-semibold">{title}</h1>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-28 lg:pb-12">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
