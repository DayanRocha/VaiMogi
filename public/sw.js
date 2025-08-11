// Service Worker para notificações push
const CACHE_NAME = 'vaimogi-notifications-v1';
const urlsToCache = [
  '/',
  '/icon-192x192.png',
  '/badge-72x72.png',
  '/icon-view.png',
  '/icon-ok.png'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('❌ Erro ao abrir cache:', error);
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker ativado');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar do cache se disponível
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Lidar com clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notificação clicada:', event.notification.data);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data;
  
  // Fechar a notificação
  notification.close();
  
  // Lidar com ações específicas
  if (action === 'view') {
    // Abrir ou focar na janela do app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Se já existe uma janela aberta, focar nela
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Enviar mensagem para navegar para a página correta
            client.postMessage({
              type: 'notification-click',
              payload: data
            });
            return client.focus();
          }
        }
        
        // Se não existe janela aberta, abrir uma nova
        if (clients.openWindow) {
          let targetUrl = '/';
          
          // Determinar URL baseada no tipo de notificação
          switch (data?.type) {
            case 'proximity':
            case 'arrival':
              targetUrl = '/#/guardian/tracking';
              break;
            case 'delay':
              targetUrl = '/#/guardian/routes';
              break;
          }
          
          return clients.openWindow(targetUrl);
        }
      })
    );
  } else if (action === 'dismiss') {
    // Apenas fechar (já foi fechada acima)
    console.log('✅ Notificação dispensada');
  } else {
    // Clique geral na notificação (sem ação específica)
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        if (clientList.length > 0) {
          // Focar na primeira janela disponível
          const client = clientList[0];
          client.postMessage({
            type: 'notification-click',
            payload: data
          });
          return client.focus();
        } else {
          // Abrir nova janela
          return clients.openWindow('/#/guardian/tracking');
        }
      })
    );
  }
});

// Lidar com fechamento da notificação
self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notificação fechada:', event.notification.data);
  
  // Enviar mensagem para o cliente sobre o fechamento
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({
          type: 'notification-close',
          payload: event.notification.data
        });
      });
    })
  );
});

// Lidar com mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('📨 Mensagem recebida no Service Worker:', event.data);
  
  const { type, payload } = event.data;
  
  switch (type) {
    case 'skip-waiting':
      self.skipWaiting();
      break;
    case 'claim-clients':
      self.clients.claim();
      break;
    default:
      console.log('📨 Tipo de mensagem desconhecido:', type);
  }
});

// Lidar com push messages (para futuras implementações com servidor)
self.addEventListener('push', (event) => {
  console.log('📬 Push message recebida:', event);
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: data.data,
      actions: data.actions,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Log de debug
console.log('🚀 Service Worker carregado e pronto para notificações!');