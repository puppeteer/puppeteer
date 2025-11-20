
/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración
const APP_ID = process.env.FACEBOOK_APP_ID;
const APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:${PORT}/callback`;

if (!APP_ID || !APP_SECRET) {
  console.error('Error: FACEBOOK_APP_ID y FACEBOOK_APP_SECRET no están configurados en .env');
  process.exit(1);
}

// Ruta principal: muestra el enlace de login
app.get('/', (req, res) => {
  const loginUrl = `https://www.facebook.com/v17.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=public_profile,email&state=random_state_string`;
  https://www.facebook.com/yenes.amaya
  res.send(`
    <h1>Facebook Long-Lived Token Generator</h1>
    <p><a href="${loginUrl}">Inicia sesión con Facebook</a></p>
    <hr>
    <h2>Flujo:</h2>
    <ol>
      <li>Haz clic en "Inicia sesión con Facebook"</li>
      <li>Se te redirigirá a /callback con un 'code'</li>
      <li>El servidor intercambia el código por un token de acceso corto</li>
      <li>Luego intercambia el token corto por uno de larga duración (60 días)</li>
      <li>Se muestra el token final</li>
    </ol>
  `);
});

// Callback: recibe el 'code' de Facebook
app.get('/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.send(`
      <h1>Error</h1>
      <p><strong>${error}:</strong> ${error_description}</p>
      <p><a href="/">Volver al inicio</a></p>
    `);
  }

  if (!code) {
    return res.send(`
      <h1>Error</h1>
      <p>No se recibió un código válido</p>
      <p><a href="/">Volver al inicio</a></p>
    `);
  }

  try {
    // Paso 1: Intercambia el código por un token de acceso corto (válido ~2 horas)
    console.log('📝 Intercambiando código por token de acceso corto...');
    const tokenResponse = await axios.get('https://graph.facebook.com/v17.0/oauth/access_token', {
      params: {
        client_id: APP_ID,
        redirect_uri: REDIRECT_URI,
        client_secret: APP_SECRET,
        code: code,
      },
    });

    const shortLivedToken = tokenResponse.data.access_token;
    console.log('✅ Token corto obtenido');

    // Paso 2: Intercambia el token corto por uno de larga duración (~60 días)
    console.log('🔄 Intercambiando token corto por token de larga duración...');
    const longLivedResponse = await axios.get('https://graph.facebook.com/v17.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: APP_ID,
        client_secret: APP_SECRET,
        fb_exchange_token: shortLivedToken,
      },
    });

    const longLivedToken = longLivedResponse.data.access_token;
    const expiresIn = longLivedResponse.data.expires_in; // Segundos (generalmente 5184000 = 60 días)
    const expiryDate = new Date(Date.now() + expiresIn * 1000).toLocaleString();

    console.log('✅ Token de larga duración obtenido');

    // Opcional: obtén información del usuario para verificar
    const userInfoResponse = await axios.get('https://graph.facebook.com/v17.0/me', {
      params: {
        fields: 'id,name,email',
        access_token: longLivedToken,
    email } = userInfoResponse.data;

    return res.send(`
      <h1>✅ Token de Larga Duración Obtenido</h1>
      <h2>Información del Usuario:</h2>
      <ul>
        <li><strong>ID:</strong> ${id}</li>
        <li><strong>Nombre:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
      </ul>
      <h2>Token:</h2>
      <textarea rows="5" cols="80" readonly>${longLivedToken}</textarea>
      <h2>Detalles:</h2>
      <ul>
        <li><strong>Duración:</strong> ${expiresIn} segundos (~${Math.round(expiresIn / 86400)} días)</li>
        <li><strong>Vence el:</strong> ${expiryDate}</li>
      </ul>
      <hr>
      <p><a href="/">Generar otro token</a></p>
      <h3>Copia este token a un lugar seguro (ej: .env, variable de entorno)</h3>
    `);
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    return res.send(`
      <h1>Error al obtener token</h1>
      <p><strong>${err.response?.data?.error || err.message}</strong></p>
      <p>${err.response?.data?.error_description || ''}</p>
      <p><a href="/">Volver al inicio</a></p>
    `);
  }
});

// Ruta para verificar un token existente
app.get('/verify/:token', async (req, res) => {
  const token = req.params.token;
  try {
    const response = await axios.get('https://graph.facebook.com/v17.0/debug_token', {
      params: {
        input_token: token,
        access_token: `${APP_ID}|${APP_SECRET}`,
      },
    });

    const { data } = response.data;
    const expiresAt = new Date(data.expires_at * 1000).toLocaleString();
    const isValid = data.is_valid;
    const expiresIn = (data.expires_at - Math.floor(Date.now() / 1000)) / 86400;

    res.json({
      is_valid: isValid,
      user_id: data.user_id,
      app_id: data.app_id,
      expires_at: expiresAt,
      days_remaining: Math.round(expiresIn),
      scopes: data.scopes,
    });
  } catch (err) {
    res.status(400).json({
      error: err.response?.data?.error || err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📍 Redirect URI: ${REDIRECT_URI}`);
  console.log('\nPasos:');
  console.log(`1. Ve a http://localhost:${PORT}`);
  console.log('2. Haz clic en "Inicia sesión con Facebook"');
  console.log('3. Sigue el flujo OAuth');
  console.log('4. El token de larga duración se mostrará en la página\n');
});
