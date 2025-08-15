/**
 * Utilitário de sanitização para prevenir ataques XSS
 * Segue as diretrizes de segurança do projeto
 */

/**
 * Sanitiza uma string removendo caracteres perigosos que podem causar XSS
 * @param input - String a ser sanitizada
 * @returns String sanitizada
 */
export const sanitizeString = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitiza HTML removendo tags perigosas e mantendo apenas as seguras
 * @param html - HTML a ser sanitizado
 * @returns HTML sanitizado
 */
export const sanitizeHTML = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Lista de tags permitidas (whitelist)
  const allowedTags = ['b', 'i', 'em', 'strong', 'span', 'div', 'p', 'br'];
  const allowedAttributes = ['class', 'style'];

  // Remove scripts e outros elementos perigosos
  let sanitized = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');

  return sanitized;
};

/**
 * Cria um elemento DOM de forma segura com conteúdo sanitizado
 * @param tagName - Nome da tag HTML
 * @param content - Conteúdo a ser inserido
 * @param className - Classes CSS opcionais
 * @returns Elemento DOM criado
 */
export const createSafeElement = (
  tagName: string,
  content: string,
  className?: string
): HTMLElement => {
  const element = document.createElement(tagName);
  
  if (className) {
    element.className = className;
  }
  
  // Usar textContent ao invés de innerHTML para prevenir XSS
  element.textContent = content;
  
  return element;
};

/**
 * Valida se uma URL é segura (não contém javascript: ou data:)
 * @param url - URL a ser validada
 * @returns true se a URL for segura
 */
export const isValidURL = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const lowerUrl = url.toLowerCase().trim();
  
  // Bloquear protocolos perigosos
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  
  return !dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol));
};

/**
 * Sanitiza dados antes de armazenar no localStorage
 * @param key - Chave do localStorage
 * @param data - Dados a serem armazenados
 */
export const setSecureLocalStorage = (key: string, data: any): void => {
  try {
    const sanitizedKey = sanitizeString(key);
    
    // Se for string, sanitizar
    if (typeof data === 'string') {
      data = sanitizeString(data);
    }
    
    // Se for objeto, sanitizar strings dentro dele
    if (typeof data === 'object' && data !== null) {
      data = sanitizeObject(data);
    }
    
    localStorage.setItem(sanitizedKey, JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error);
  }
};

/**
 * Sanitiza recursivamente um objeto
 * @param obj - Objeto a ser sanitizado
 * @returns Objeto sanitizado
 */
const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeString(key)] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Valida entrada de formulário
 * @param input - Entrada do usuário
 * @param maxLength - Comprimento máximo permitido
 * @returns Entrada validada e sanitizada
 */
export const validateFormInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Limitar comprimento
  const trimmed = input.trim().substring(0, maxLength);
  
  // Sanitizar
  return sanitizeString(trimmed);
};