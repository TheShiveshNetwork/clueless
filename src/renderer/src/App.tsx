import { ToastProvider } from "./providers/toast-provider"
import { QueryProvider } from "./providers/query-provider"
import { useToast } from "./providers/toast-context"
import { WelcomeScreen } from "./components/welcome-screen"

function ToastEX(): React.JSX.Element {
  const { showToast } = useToast()

  return (
    <>
      <h1
        className="text-3xl font-bold cursor-pointer "
        onClick={() => showToast("Hello!", "This is a toast from ToastEX", "success")}
      >
        Click me to show toast
      </h1>
    </>
  )
}

function App(): React.JSX.Element {
  return (
    <QueryProvider>
      <ToastProvider>
         <WelcomeScreen/>
      </ToastProvider>
    </QueryProvider>
  )
}

export default App
