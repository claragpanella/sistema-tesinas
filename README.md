# 📚 Sistema de Gestión de Tesinas Universitarias

Sistema web completo para la gestión de tesinas universitarias con roles de administrador, tutor y alumno. Incluye chat asistente con IA para ayuda académica.

## Características Principales

### 👤 Gestión de Usuarios
- **3 roles:** Administrador, Tutor y Alumno
- Sistema de autenticación con JWT
- Registro de alumnos (requiere activación por admin)
- Gestión de perfiles (cambio de nombre y contraseña)

### 📄 Gestión de Tesinas
- Los alumnos pueden subir **una única tesina**
- Sistema de **versionado** (v1, v2, v3...)
- **3 estados:** Pendiente, Aprobada, Rechazada
- Los alumnos pueden **editar** su tesina mientras está pendiente
- Los alumnos pueden **reenviar** versiones si fue rechazada
- Los tutores pueden **revisar y aprobar/rechazar** con observaciones
- Preview y descarga de archivos (PDF, DOCX, DOC)

### Chat Asistente con IA
- Asistente académico con Groq
- Acceso contextual al contenido de la tesina
- Ayuda con estructura, formato APA, redacción
- Exclusivo para alumnos

### Contenido Académico
- **Pautas:** Normas APA, estructura, formato
- **Ejemplos:** Tesinas modelo para referencia
- Gestión completa por parte del admin

### Interfaz de Usuario
- Dashboards personalizados por rol
- Diseño responsive (mobile-first)
- Filtros y búsqueda avanzada
- Sistema de notificaciones y alertas

---

## Tecnologías Utilizadas

### Backend
- **Python 3.14+**
- **Flask** - Framework web
- **SQLite** - Base de datos
- **JWT** - Autenticación
- **bcrypt** - Encriptación de contraseñas
- **Groq API** - Chat asistente con IA

### Frontend
- **React 18** - Librería UI
- **React Router** - Navegación
- **Axios** - Peticiones HTTP
- **Tailwind CSS** - Estilos
- **Lucide React** - Iconos

---

## Instalación

### **Requisitos Previos**
- Python 3.14 o superior
- Node.js 18 o superior
- npm o yarn

### **1. Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/repo-tesinas.git
cd repo-tesinas
```

### **2. Configurar Backend**
```powershell
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
# Crear archivo .env con:
```

**`backend/.env`:**
```env
DB_PATH=database.db
JWT_SECRET_KEY=tu_clave_secreta_generada_con_secrets
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=2592000
GROQ_API_KEY=tu_clave_de_groq
```

**Generar JWT_SECRET_KEY:**
```powershell
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

**Obtener GROQ_API_KEY:**
- Ve a: https://console.groq.com/
- Crea una cuenta gratuita
- Ve a "API Keys" y genera una nueva key
- Copiá la key (empieza con `gsk_`)

```powershell
# Inicializar base de datos
python database.py

# Ejecutar servidor
python app.py
```

El backend estará corriendo en `http://localhost:5000`

### **3. Configurar Frontend**
```powershell
cd frontend

# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

El frontend estará corriendo en `http://localhost:5173`

---

## Usuarios de Prueba

### Administrador
- **Email:** admin@admin.com
- **Contraseña:** admin123

### Tutor
- **Email:** maria.garcia@universidad.edu
- **Contraseña:** tutor123

### Alumno
- **Email:** pedro.lopez@estudiante.edu
- **Contraseña:** alumno123

---

## Estructura del Proyecto
```
repo-tesinas/
├── backend/
│   ├── routes/           # Endpoints de la API
│   ├── utils/            # Utilidades (JWT, DB, etc)
│   ├── uploads/          # Archivos subidos
│   ├── database.py       # Configuración de BD
│   ├── app.py           # Punto de entrada
│   └── requirements.txt  # Dependencias Python
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── pages/       # Páginas de la app
│   │   ├── context/     # Context API (Auth)
│   │   └── services/    # API service (axios)
│   ├── public/
│   └── package.json
│
└── README.md
```

---

## Funcionalidades por Rol

### 👨‍💼 Administrador
- ✅ Gestionar alumnos (crear, editar, activar/desactivar, eliminar)
- ✅ Gestionar tutores (crear, editar, activar/desactivar, eliminar)
- ✅ Ver todas las tesinas
- ✅ Eliminar tesinas
- ✅ Gestionar pautas y ejemplos
- ✅ Activar cuentas nuevas de alumnos

### 👨‍🏫 Tutor
- ✅ Ver tesinas asignadas
- ✅ Revisar y aprobar/rechazar tesinas
- ✅ Agregar observaciones
- ✅ Ver historial de versiones
- ✅ Consultar pautas y ejemplos

### 🎓 Alumno
- ✅ Subir una tesina
- ✅ Editar tesina mientras está pendiente
- ✅ Reenviar versiones corregidas
- ✅ Ver estado y observaciones
- ✅ Chat asistente con IA
- ✅ Consultar pautas y ejemplos
- ✅ Ver historial de versiones

---

## Chat Asistente

El chat asistente usa **Groq** (gratuito) para:

- Revisar estructura y redacción
- Sugerir mejoras en formato APA
- Ayudar con la organización del contenido
- Responder preguntas académicas
- Dar feedback constructivo

**Configuración:**
1. Obtener API key en https://console.groq.com/keys
2. Agregarla al archivo `.env` como `GROQ_API_KEY`

---

## Scripts Disponibles

### Backend
```powershell
python app.py              # Ejecutar servidor
python database.py         # Inicializar BD
```

### Frontend
```powershell
npm run dev               # Modo desarrollo
npm run build            # Build para producción
npm run preview          # Preview del build
```

---

## Seguridad

- ✅ Autenticación JWT con tokens de acceso y refresco
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Validación de roles en cada endpoint
- ✅ Validación de archivos (tipo y extensión)
- ✅ Protección contra inyección SQL (queries parametrizadas)
- ✅ CORS configurado
- ✅ Variables de entorno para secretos

---

## Problemas Conocidos

- El chat asistente requiere conexión a internet
- Los archivos muy grandes (>10MB) pueden tardar en subir
---

**¡Gracias por usar el Sistema de Gestión de Tesinas!** 🎓