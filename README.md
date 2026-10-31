# eventos-frontend — Eventos Académicos FISI (React + Vite)

> **Curso:** Taller de Construcción de Software Web — UNMSM FISI  
> **Integrantes:** Miguel Solis & Mihael Cristobal  
> **Tema:** Frontend conectado a microservicio backend y despliegue continuo en Azure (Semana 8)

Aplicación web (SPA) para que los estudiantes exploren eventos académicos universitarios, consulten agendas y gestionen inscripciones en tiempo real conectándose a la API REST del microservicio backend.

## 🚀 Tecnologías
- **Frontend:** React 19 + React Router 7 + Vite 8
- **Estilos:** CSS plano modular y responsivo
- **API Client:** `src/services/api.js` con soporte para variables de entorno (`VITE_API_URL`)
- **Hosting:** Azure Static Web Apps
- **CI/CD:** GitHub Actions (`.github/workflows/azure-static-web-apps.yml`)
- **Contenedores:** Dockerfile multi-stage con Nginx

## 🛠️ Ejecución Local

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar variable de entorno:
   Asegurar que el backend esté corriendo en el puerto 3000 (`http://localhost:3000`).

3. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Compilar para producción:
   ```bash
   npm run build
   ```
