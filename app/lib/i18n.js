// i18n util (Simula la carga desde base de datos / cookie sin romper Edge Middleware)
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

export async function getLocale() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
  // Fallback: si no hay, por defecto es 'ca' según requisitos si no se conoce, pero pondremos 'es' si existe, si no 'ca'.
  // Para ser estrictos con la regla: "Si no es contemplado que se abra en catalan".
  return (localeCookie === 'es' || localeCookie === 'ca') ? localeCookie : 'ca';
}

export async function getTranslations(pageName) {
  const locale = await getLocale();
  const filePath = path.join(process.cwd(), 'locales', locale, `${pageName}.json`);
  
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    // Fallback a Español si falla
    console.warn(`Missing translations for ${locale}/${pageName}.json. Fallback to ES.`);
    const fallbackPath = path.join(process.cwd(), 'locales', 'es', `${pageName}.json`);
    const fallbackContents = await fs.readFile(fallbackPath, 'utf8');
    return JSON.parse(fallbackContents);
  }
}
