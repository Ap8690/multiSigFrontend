import "./App.css"
import {BrowserRouter as Router, useRoutes} from "react-router-dom"
import Login from "./login"
import Trx from "./Trx"
import {QueryClient, QueryClientProvider} from "@tanstack/react-query"
import {WagmiProvider} from "wagmi"
import {config} from "./wagmiProvider/config"

const queryClient = new QueryClient()

const AppRoutes = () => {
  let routes = useRoutes([
    {path: "/", element: <Login />},
    {path: "wallet/:id", element: <Trx />},
    // Add more routes as needed
  ])
  return routes
}

const App = () => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AppRoutes />
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
