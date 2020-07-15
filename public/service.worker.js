self.addEventListener("push", function (ev) {
    const data = ev.data.json();
    ev.waitUntil(self.registration.showNotification(data.title, data.options));
});

self.addEventListener("notificationclick", (ev) => {
    ev.notification.close();
    const url = ev.notification.data.url;
    if (url) {
        ev.waitUntil(self.clients.openWindow(url));
    }
});
