const MEETING_URL = "https://stanford.zoom.us/j/101154520?pwd=cXp3Y0I3eVhSbjZXZ05hYTdGZ3FOUT09";

self.addEventListener("push", function (ev) {
    const data = ev.data.json();
    ev.waitUntil(self.registration.showNotification(data.title, data.options));
});

self.addEventListener("notificationclick", (ev) => {
    ev.notification.close();
    if (ev.notification.body) {
        ev.waitUntil(self.clients.openWindow(MEETING_URL));
    }
});
