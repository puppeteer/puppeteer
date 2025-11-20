/**
 * Script auxiliar para intercambiar tokens de forma manual
 * Útil si ya tienes un código OAuth o un token corto
 */
require('dotenv').config();
const axios = require('axios');

const APP_ID = process.env.FACEBOOK_APP_ID;https://www.facebook.com/yenes.amaya
const APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/callback';

async function exchangeCodeForToken(code) {
  try {
    console.log('📝 Intercambiando código por token corto...');
    const response = await axios.get('https://graph.facebook.com/v17.0/oauth/access_token', {
      params: {
        client_id: APP_ID,
        redirect_uri: REDIRECT_URI,
        client_secret: APP_SECRET,
        code: code,
      },
    });
    return response.data.access_token;
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    throw err;
  }
}

async function exchangeForLongLived(shortToken) {
  try {
    console.log('🔄 Intercambiando por token de larga duración...');
    const response = await axios.get('https://graph.facebook.com/v17.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: APP_ID,
        client_secret: APP_SECRET,
        fb_exchange_token: shortToken,
      },
    });
    return response.data;
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    throw err;
  }
}

async function verifyToken(token) {
  try {
    console.log('🔍 Verificando token...');
    const response = await axios.get('https://graph.facebook.com/v17.0/debug_token', {
      params: {
        input_token: token,
        access_token: `${APP_ID}|${APP_SECRET}`,
      },
    });
    return response.data.data;
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    throw err;
  }
}

// Uso desde línea de comandos
const command = process.argv[2];
const argument = process.argv[3];

(async () => {
  if (!APP_ID || !APP_SECRET) {
    console.error('❌ Error: configura FACEBOOK_APP_ID y FACEBOOK_APP_SECRET en .env');
    process.exit(1);
  }

  switch (command) {
    case 'exchange-code':
      if (!argument) {
        console.error('Uso: node token-exchange.js exchange-code <CODE>');
        process.exit(1);
      }
      const token = await exchangeCodeForToken(argument);
      console.log('✅ Token corto:', token);
      const longLived = await exchangeForLongLived(token);
      console.log('✅ Token de larga duración:', longLived.access_token);
      console.log(`   Vence en: ${longLived.expires_in} segundos (~${Math.round(longLived.expires_in / 86400)} días)`);
      break;

    case 'exchange-short':
      if (!argument) {
        console.error('Uso: node token-exchange.js exchange-short <SHORT_TOKEN>');
        process.exit(1);
      }
      const result = await exchangeForLongLived(argument);
      console.log('✅ Token de larga duración:', result.access_token);
      console.log(`   Vence en: ${result.expires_in} segundos (~${Math.round(result.expires_in / 86400)} días)`);
      break;

    case 'verify':
      if (!argument) {
        console.error('Uso: node token-exchange.js verify <TOKEN>');
        process.exit(1);
      }
      const info = await verifyToken(argument);
      console.log('✅ Información del token:');
      console.log(`   Válido: ${info.is_valid}`);
      console.log(`   User ID: ${info.user_id}`);
      console.log(`   App ID: ${info.app_id}`);
      console.log(`   Vence: ${new Date(info.expires_at * 1000).toLocaleString()}`);
      console.log(`   Scopes: ${info.scopes?.join(', ')}`);
      break;

    default:
      console.log(`
Uso: node token-exchange.js <COMANDO> [ARGUMENTO]

Comandos:
  exchange-code <CODE>       Intercambia un código OAuth por token
  exchange-short <TOKEN>     Intercambia token corto por larga duración
  verify <TOKEN>             Verifica un token

Ejemplos:
  node token-exchange.js exchange-code CODIGO_AQUI
  node token-exchange.js exchange-short TOKEN_CORTO_AQUI
  node token-exchange.js verify TOKEN_AQUI
      `);
  }
})();
