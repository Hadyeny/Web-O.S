/**
 * Utilitário seguro para consumo de APIs no ecossistema Plioou.
 * Valida formatos de resposta, intercepta respostas HTML indevidas (como páginas 404/SPA)
 * e gera alertas em ambiente de desenvolvimento.
 */

/**
 * Utilitário seguro para disparar requisições HTTP garantindo
 * 'credentials: include' para transmissão dos Cookies HttpOnly entre portas locais
 * e cabeçalhos padrão adequados.
 */
export async function safeFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const mergedOptions: RequestInit = {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  };

  const response = await fetch(url, mergedOptions);

  // Intercepta códigos de resposta HTTP 401 e 403 (sessão HttpOnly expirada ou não autorizada)
  if (response.status === 401 || response.status === 403) {
    if (typeof window !== 'undefined') {
      // 1. Limpeza imediata de todo o estado residual de sessão e layout do app
      try {
        localStorage.removeItem('@Pliioou:token');
        localStorage.removeItem('@Pliioou:user');
        localStorage.removeItem('plioou_jwt');
        localStorage.setItem('@Pliioou:logged_out', 'true');
        sessionStorage.clear();
      } catch (err) {
        console.warn('[safeFetch] Falha ao limpar cache local de sessão:', err);
      }

      // 2. Notificação interna suave para desautenticação sem quebrar o ciclo do React SPA
      try {
        window.dispatchEvent(new CustomEvent('plioou:unauthorized'));
      } catch {
        // no-op
      }
    }
  }

  return response;
}

export async function safeJson<T = any>(res: Response | null | undefined, url: string): Promise<T | null> {
  if (!res) return null;

  // Intercepta respostas de autenticação/autorização (401 Unauthorized ou 403 Forbidden)
  // Evita falsos positivos de erro de rota quando o usuário não está autenticado ou o token expirou
  if (res.status === 401 || res.status === 403) {
    return null;
  }

  const contentType = res.headers.get('content-type') || '';

  // Validação estrita de Content-Type: rejeita HTML de SPA ou formatos inesperados
  if (!contentType.includes('application/json')) {
    return null;
  }

  // Tratamento de respostas com status de erro HTTP
  if (!res.ok) {
    return null;
  }

  try {
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[API Error] Falha ao converter resposta de ${url} em JSON:`, err);
    return null;
  }
}
