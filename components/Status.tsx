import { ReactElement, useEffect, useState } from "react";
import useServiceWorker from "~/lib/useServiceWorker";

export default function Status(props: { status: string | null }): ReactElement {
    const sw = useServiceWorker("/service.worker.js");

    const [status, setStatus] = useState(props.status ?? "");

    useEffect(() => {
        if (sw === null) {
            setStatus("Loading Service Worker...");
            return;
        }
        setStatus("Loading subscription...");
        sw.pushManager.getSubscription().then(async (sub) => {
            if (!sub) {
                setStatus("No subscription found.");
                return;
            }
            setStatus("Subscription Found.");
        });
    }, [sw]);

    return <div>{status}</div>;
}
