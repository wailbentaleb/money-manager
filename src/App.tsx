import { Route, Routes } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Depenses from './pages/Depenses'
import Dettes from './pages/Dettes'
import Stats from './pages/Stats'
import Parametres from './pages/Parametres'

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/depenses" element={<Depenses />} />
          <Route path="/dettes" element={<Dettes />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/reglages" element={<Parametres />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </AppProvider>
  )
}
