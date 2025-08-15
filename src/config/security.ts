/**
 * Configurações de segurança centralizadas para o aplicativo VaiMogi
 * Segue as diretrizes de segurança OWASP e boas práticas
 */

// Configurações de Content Security Policy
export const CSP_CONFIG = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "https://api.mapbox.com"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: ["'self'", "https://api.mapbox.com"],
  fontSrc: ["'self'", "https:"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'none'"]
};

// Configurações de validação de entrada
export const INPUT_VALIDATION = {
  maxStringLength: 1000,
  maxEmailLength: 254,
  maxPhoneLength: 20,
  maxNameLength: 100,
  maxAddressLength: 500,
  minPasswordLength: 8,
  maxPasswordLength: 128
};

// Padrões de validação
export const VALIDATION_PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  alphanumeric: /^[a-zA-Z0-9\s]+$/,
  noScriptTags: /^(?!.*<script).*$/i
};

// URLs permitidas para redirecionamento
export const ALLOWED_REDIRECT_URLS = [
  'https://maps.google.com',
  'https://waze.com',
  'https://maps.apple.com'
];

// Configurações de localStorage seguro
export const STORAGE_CONFIG = {
  maxItemSize: 5 * 1024 * 1024, // 5MB
  sensitiveKeys: ['password', 'token', 'secret', 'key', 'auth'],
  encryptionRequired: ['guardianData', 'driverData'],
  maxStorageItems: 50
};

// Headers de segurança recomendados
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(self), microphone=(), camera=()'
};

// Configurações de rate limiting
export const RATE_LIMITING = {
  loginAttempts: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    blockDurationMs: 30 * 60 * 1000 // 30 minutos
  },
  apiCalls: {
    maxRequests: 100,
    windowMs: 60 * 1000 // 1 minuto
  }
};

// Lista de caracteres perigosos para sanitização
export const DANGEROUS_CHARS = {
  html: ['<', '>', '"', "'", '&'],
  sql: ["'", '"', ';', '--', '/*', '*/', 'xp_', 'sp_'],
  script: ['javascript:', 'vbscript:', 'data:', 'file:']
};

// Configurações de logging seguro
export const LOGGING_CONFIG = {
  sensitiveFields: ['password', 'token', 'secret', 'key', 'auth', 'credit_card', 'ssn', 'cpf'],
  maxLogSize: 10 * 1024 * 1024, // 10MB
  logLevels: ['error', 'warn', 'info', 'debug'],
  excludeFromLogs: ['password', 'confirmPassword', 'token', 'secret']
};

// Configurações de sessão
export const SESSION_CONFIG = {
  maxAge: 24 * 60 * 60 * 1000, // 24 horas
  renewThreshold: 30 * 60 * 1000, // 30 minutos
  secure: true,
  httpOnly: true,
  sameSite: 'strict' as const
};

// Validação de tipos de arquivo permitidos
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'text/plain'],
  maxFileSize: 5 * 1024 * 1024 // 5MB
};

/**
 * Verifica se uma URL é segura para redirecionamento
 */
export const isSecureRedirectUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ALLOWED_REDIRECT_URLS.some(allowedUrl => 
      urlObj.origin === new URL(allowedUrl).origin
    );
  } catch {
    return false;
  }
};

/**
 * Gera um nonce aleatório para CSP
 */
export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Verifica se um campo contém dados sensíveis
 */
export const isSensitiveField = (fieldName: string): boolean => {
  const lowerFieldName = fieldName.toLowerCase();
  return LOGGING_CONFIG.sensitiveFields.some(sensitive => 
    lowerFieldName.includes(sensitive)
  );
};