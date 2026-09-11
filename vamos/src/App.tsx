import { useState } from 'react'
import PhoneShell from './components/PhoneShell'
import BottomNav from './components/BottomNav'
import type { MainTab } from './components/BottomNav'
import OnboardingScreen from './screens/OnboardingScreen'
import LoginScreen from './screens/LoginScreen'
import MainScreen from './screens/MainScreen'
import CalendarScreen from './screens/CalendarScreen'
import ReportScreen from './screens/ReportScreen'
import ReflectionScreen from './screens/ReflectionScreen'
import ManageScreen from './screens/ManageScreen'
import ProfileScreen from './screens/ProfileScreen'
import { AppStoreProvider } from './store/AppStore'

type Gate = 'onboarding' | 'login' | 'app'

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}
function writeFlag(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? '1' : '0')
  } catch {
    // ignore — draft still works without persistence
  }
}

export default function App() {
  const [gate, setGate] = useState<Gate>(() => {
    if (!readFlag('vamos.onboarded')) return 'onboarding'
    if (!readFlag('vamos.authed')) return 'login'
    return 'app'
  })
  const [tab, setTab] = useState<MainTab>('home')
  const [showProfile, setShowProfile] = useState(false)

  return (
    <AppStoreProvider>
      <PhoneShell>
        {gate === 'onboarding' && (
          <OnboardingScreen
            onDone={() => {
              writeFlag('vamos.onboarded', true)
              setGate('login')
            }}
          />
        )}

        {gate === 'login' && (
          <LoginScreen
            onLogin={() => {
              writeFlag('vamos.authed', true)
              setGate('app')
            }}
          />
        )}

        {gate === 'app' && (
          <>
            {tab === 'home' && <MainScreen onOpenProfile={() => setShowProfile(true)} />}
            {tab === 'calendar' && <CalendarScreen />}
            {tab === 'report' && <ReportScreen />}
            {tab === 'reflection' && <ReflectionScreen />}
            {tab === 'manage' && <ManageScreen />}
            <BottomNav active={tab} onChange={setTab} />
            {showProfile && (
              <ProfileScreen
                onBack={() => setShowProfile(false)}
                onLogout={() => {
                  writeFlag('vamos.authed', false)
                  setShowProfile(false)
                  setTab('home')
                  setGate('login')
                }}
              />
            )}
          </>
        )}
      </PhoneShell>
    </AppStoreProvider>
  )
}
