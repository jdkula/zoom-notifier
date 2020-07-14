import { useState } from "react";

const registeredServiceWorkers = new Set<string>();

export default function useServiceWorker(name: string): ServiceWorkerRegistration | null {
    const [worker, setWorker] = useState<ServiceWorkerRegistration | null>(null);

    if (typeof window === "undefined") {
        return worker;
    }

    if (!registeredServiceWorkers.has(name)) {
        navigator.serviceWorker.register(name);
        registeredServiceWorkers.add(name);
    }

    navigator.serviceWorker.ready.then((reg) => {
        setWorker(reg);
    });

    return worker;
}
