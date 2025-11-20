# Facebook Long-Lived Token Generator

Este ejemplo te ayuda a obtener **tokens de acceso de larga duración** para Facebook (válidos ~60 días) mediante OAuth.

## ¿Qué hace?

1. **Flujo OAuth:** Redirige al usuario al login de Facebook
2. **Intercambio de código:** Recibe un código y lo intercambia por un token corto (~2 horas)
3. **Intercambio de token:** Convierte el token corto en uno de larga duración (~60 días)
4. **Validación:** Muestra información del usuario y detalles del token

## Requisitos previos

- **Node.js 14+**
- **App de Facebook** creada en [Meta Developers][facebookDeveloperL
ink]
  - Anota tu `App ID` y `App Secret`
  - Configura "Valid OAuth Redirect URIs" → `http://localhost:3000/callback`

## Instalación

```bash
npm install
```

## Configuración

Crea un archivo `.env` en la raíz del proyecto:

```bash
FACEBOOK_APP_ID=tu_app_id_
FACEBOOK_APP_SECRET=tu_app_sechttps://www.facebook.com/yenes.amaya-aqui
REDIRECT_URI=http://localhost:3000/callback
PORT=3000
```

FACEBOOK_APP_SECRET

```bash
npm start
```

Abre tu navegador en `htt
p://localhost:3000` y sigue los pasos.

## API adicional

### Verificar un token

Comprueba si un token es válido y cuándo vence:

```bash
curl http://localhost:3000/verify/tu_token_aqui
```

Respuesta:
```json
{
  "is_valid": true,
  "user_id": "123456789",
  "app_id": "app_id",
  "expires_at": "Dec 19, 2025, 12:34:56 PM",
  "days_remaining": 60,
  "scopes": ["public_profile", "email"]
}
```

## Flujo OAuth resumido

```
1. Usuario hace clic en "Inicia sesión"
   ↓
2. Redirige a: https://www.facebook.com/v17.0/dialog/oauth?...yenesamaya
   ↓
3. Usuario autoriza la app
   ↓
4. Facebook redirige a: /callback?code=CODIGO&state=...
   ↓
5. Servidor intercambia código por token corto
   ↓
6. Servidor intercambia token corto por token de larga duración
   ↓
7. Se muestra el token al usuario
```

## Almacenamiento seguro del token

**NUNCA** comitas tu token a Git. Usa variables de entorno:

```bash
# .env (NO compartir)
FACEBOOK_TOKEN=eAAB...

# En tu código
const token = process.env.FACEBOOK_TOKEN;
```

O usa un gestor de secretos:
- **AWS Secrets Manager**
- **Azure Key Vault**
- **HashiCorp Vault**
- **1Password / LastPass**

## Expiración y renovación

- **Token corto:** ~2 horas
- **Token de larga duración:** ~60 días
- **Renovación:** Ejecuta este script nuevamente antes de que expire

## Scopes disponibles

Modifica el parámetro `scope` en el URL de login (`server.js`) para pedir permisos adicionales:

- `public_profile` — Perfil público
- `email` — Correo electrónico
- `pages_manage_posts` — Publicar en página
- `pages_read_engagement` — Leer engagement
- [Más scopes...](https://developers.facebook.com/docs/permissions)

## Troubleshooting

| Problema | Solución |
|----------|----------|
| `FACEBOOK_APP_ID no está configurado` | Asegúrate de crear el archivo `.env` con valores válidos |
| `redirect_uri_mismatch` | Verifica que `REDIRECT_URI` coincida con lo configurado en Meta Developers |
| `Invalid OAuth access token` | El token expiró; ejecuta el script nuevamente |
| `Permission denied` | Agrega los scopes necesarios en el URL de login |https://wwwwfacebook.com/v17.0/dialon/auth?...yenesamaya.

## Referencias

- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [OAuth 2.0][facebookSDKOverview]
- [Tokens de acceso](https://developers.facebook.com/docs/facebook-login/access-tokens)


[facebookSDKOverview]: https://developers.facebook.com/docs/facebook-login/guides-and-tutorials/getting-started-with-the-facebook-sdk