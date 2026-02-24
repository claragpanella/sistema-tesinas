# 🔐 Guía de uso de JWT en el sistema

## 📋 Endpoints de autenticación

### 1. Login
**POST** `/login`

**Body:**
```json
{
  "email": "admin@admin.com",
  "password": "admin123"
}
```

**Respuesta:**
```json
{
  "message": "Login exitoso",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "Administrador",
    "rol": "admin"
  }
}
```

---

### 2. Refresh Token
**POST** `/refresh`

**Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 3. Obtener usuario actual
**GET** `/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta:**
```json
{
  "id": 1,
  "nombre": "Administrador",
  "email": "admin@admin.com",
  "rol": "admin",
  "activo": true
}
```

---

## 🔒 Cómo usar los tokens

### En JavaScript (fetch):
```javascript
const token = localStorage.getItem('access_token');

fetch('http://localhost:5000/admin/usuarios', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

### En axios:
```javascript
axios.get('http://localhost:5000/admin/usuarios', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### En PowerShell:
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:5000/admin/usuarios" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $token"}
```

---

## 🛡️ Decoradores disponibles

| Decorador | Descripción |
|-----------|-------------|
| `@token_required` | Requiere token válido (cualquier rol) |
| `@admin_required` | Solo administradores |
| `@tutor_required` | Solo tutores (y admin) |
| `@alumno_required` | Solo alumnos (y admin) |

---

## ⏱️ Duración de tokens

- **Access Token:** 1 hora (3600 segundos)
- **Refresh Token:** 30 días (2592000 segundos)

Se pueden cambiar en el archivo `.env`:
```env
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=2592000
```

---

## 🔄 Flujo recomendado

1. **Login:** Usuario envía credenciales → recibe `access_token` y `refresh_token`
2. **Guardar tokens:** Frontend guarda ambos tokens (localStorage, sessionStorage, etc.)
3. **Usar access_token:** En cada petición, enviar `Authorization: Bearer {access_token}`
4. **Token expirado:** Si recibe error 401, usar `refresh_token` para obtener nuevo `access_token`
5. **Refresh expirado:** Si refresh token expira, redirigir a login

---

## ⚠️ Seguridad

- ✅ **NUNCA** compartir el `SECRET_KEY` o `JWT_SECRET_KEY`
- ✅ Cambiar las claves secretas en producción
- ✅ Usar HTTPS en producción
- ✅ No guardar tokens en URLs o cookies inseguras
- ✅ Implementar logout limpiando tokens del frontend