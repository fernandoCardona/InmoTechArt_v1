import { SignJWT, jwtVerify } from 'jose';

// Obtiene la clave secreta del entorno, con fallback para desarrollo local
const secretKey = process.env.JWT_SECRET || 'neretxaus_default_secret_key_change_me_in_prod';
const key = new TextEncoder().encode(secretKey);

/**
 * Encripta el payload en un JWT firmado usando HS256.
 * Edge compatible.
 */
export async function encrypt(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(key);
}

/**
 * Desencripta y verifica un JWT.
 * Lanza error si es inválido o ha expirado.
 * Edge compatible.
 */
export async function decrypt(token) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    // Si expira o es inválido, devolvemos null
    return null;
  }
}
