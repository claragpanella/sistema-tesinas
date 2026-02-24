import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/Layout/ProtectedRoute'

// Páginas públicas
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { UnauthorizedPage } from './pages/UnauthorizedPage'
import { RegisterPage } from './pages/RegisterPage'

// Páginas compartidas
import { DashboardPage } from './pages/DashboardPage'
import { PautasPage } from './pages/PautasPage'
import { EjemplosPage } from './pages/EjemplosPage'
import { TesinaListPage } from './pages/TesinaListPage'
import { SubirTesinaPage } from './pages/SubirTesinaPage'
import { AdminEjemplosPage } from './pages/admin/AdminEjemplosPage'
import { AdminUsuariosPage } from './pages/admin/AdminUsuariosPage'
import { AdminTutoresPage } from './pages/admin/AdminTutoresPage'
import { TutorTesinaPage } from './pages/tutor/TutorTesinaPage'
import { TesinaDetallePage } from './pages/TesinaDetallePage'
import { AdminPautasPage } from './pages/admin/AdminPautasPage'
import { PerfilPage } from './pages/PerfilPage'
import { ChatAsistentePage } from './pages/ChatAsistentePage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ===================== */}
          {/* RUTAS PÚBLICAS        */}
          {/* ===================== */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} /> 
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* ===================== */}
          {/* RUTAS COMPARTIDAS     */}
          {/* ===================== */}
          <Route path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['alumno']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route path="/tutor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['tutor']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route path="/pautas"
            element={
              <ProtectedRoute>
                <PautasPage />
              </ProtectedRoute>
            }
          />

          <Route path="/ejemplos"
            element={
              <ProtectedRoute>
                <EjemplosPage />
              </ProtectedRoute>
            }
          />

          <Route path="/tesinas"
            element={
              <ProtectedRoute>
                <TesinaListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <PerfilPage />
              </ProtectedRoute>
            }
          />

          {/* ===================== */}
          {/* RUTAS ALUMNO          */}
          {/* ===================== */}
          <Route path="/tesinas/subir"
            element={
              <ProtectedRoute allowedRoles={['alumno']}>
                <SubirTesinaPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat"
            element={
              <ProtectedRoute allowedRoles={['alumno']}>
                <ChatAsistentePage />
              </ProtectedRoute>
            }
          />

          {/* ===================== */}
          {/* RUTAS ADMIN           */}
          {/* ===================== */}
          <Route path="/admin/ejemplos"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminEjemplosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/tutores"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminTutoresPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/pautas"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPautasPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsuariosPage />
              </ProtectedRoute>
            }
          />
          
          {/* ===================== */}
          {/* RUTAS TUTOR           */}
          {/* ===================== */}
          <Route
            path="/tutor/tesinas"
            element={
              <ProtectedRoute allowedRoles={['tutor']}>
                <TutorTesinaPage />
              </ProtectedRoute>
            }
          />

          {/* ===================== */}
          {/* RUTAS TESINAS         */}
          {/* ===================== */}
          <Route
            path="/tesinas/:id"
            element={
              <ProtectedRoute>
                <TesinaDetallePage />
              </ProtectedRoute>
            }
          />

          {/* ===================== */}
          {/* REDIRECCIONES         */}
          {/* ===================== */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App