import { useCallback, useState } from "react"
import  SettingsDialog  from "./components/settings-dailogue"
// ✅ fix typo: dailogue -> dialogue

import { ToastProvider } from "./providers/toast-provider"
import { QueryProvider } from "./providers/query-provider"
import { WelcomeScreen } from "./components/welcome-screen"

function App(): React.JSX.Element {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleSettingsOpenChange = useCallback((open: boolean) => {
    setIsSettingsOpen(open)
  }, [])

  return (
    <QueryProvider>
      <ToastProvider>
        <div>
          <WelcomeScreen onOpenSettings={handleSettingsOpenChange} />
        </div>
        <SettingsDialog open={isSettingsOpen} onOpenChange={handleSettingsOpenChange} />
      </ToastProvider>
    </QueryProvider>
  )
}

export default App
