import { ReactElement, useEffect, useState } from "react";
import Head from "next/head";
import styled, { createGlobalStyle } from "styled-components";
import Status from "~/components/Status";
import useServiceWorker from "~/lib/useServiceWorker";

const GlobalStyle = createGlobalStyle`
    html {
        width: 100%;
        height: 100%;
        font-family: "Helvetica", sans-serif;
    }
    body {
        background-color: #4d7ac4;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    * {
        box-sizing: border-box;
    }
`;
const Page = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
`;
const Container = styled.div`
    background-color: #fff;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 20px 20px 100px -20px rgba(0, 0, 0, 1);
`;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function sendSub(subscription: PushSubscription, onStart: boolean, onEnd: boolean): Promise<boolean> {
    const body = JSON.stringify({ subscription, start: onStart, end: onEnd });

    console.log(JSON.parse(body));

    const reply = await fetch("/api/push", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body,
    });
    return reply.ok;
}

async function endSub(subscription: PushSubscription): Promise<boolean> {
    const result = await fetch("/api/unsub", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            id: subscription.endpoint,
        }),
    });

    return result.ok;
}

export default function Index(): ReactElement {
    const [start, setStart] = useState(true);
    const [end, setEnd] = useState(true);

    const sw = useServiceWorker("/service.worker.js");

    useEffect(() => {
        setStart(window.localStorage.getItem("start") !== "false");
        setEnd(window.localStorage.getItem("end") !== "false");
    }, []);

    useEffect(() => {
        window.localStorage.setItem("start", start.toString());
        window.localStorage.setItem("end", end.toString());
    }, [start, end]);

    const [status, setStatus] = useState("");

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


    const subscribe = async () => {
        setStatus("Working...");
        Notification.requestPermission().then(async (auth) => {
            if (auth !== "granted") {
                setStatus("Permission denied.");
                return;
            }

            let subscription = await sw.pushManager.getSubscription();
            if (!subscription) {
                const key = await (await fetch("/api/key")).text();
                subscription = await sw.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(key),
                });
                await sendSub(subscription, start, end);
                setStatus("Subscribed.");
            } else {
                await sendSub(subscription, start, end);
                setStatus("Subscription updated.");
            }
        });
    };

    const unsubscribe = async () => {
        const subscription = await sw.pushManager.getSubscription();
        if (!subscription) {
            setStatus("No subscription to unsubscribe from.");
        } else {
            await endSub(subscription);
            await subscription.unsubscribe();
            setStatus("Unsubscribed.");
        }
    };

    return (
        <Page>
            <Head>
                <title>Squad Zoom</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                <link rel="manifest" href="/site.webmanifest" />
            </Head>
            <GlobalStyle />
            <Container>
                <div>
                    <label>
                        <input type="checkbox" checked={start} onChange={(e) => setStart(e.target.checked)} />
                        Notify when the first person enters!
                    </label>
                </div>
                <div>
                    <label>
                        <input type="checkbox" checked={end} onChange={(e) => setEnd(e.target.checked)} />
                        Notify when the last person leaves!
                    </label>
                </div>
                <button onClick={subscribe}>Subscribe/Update Subscription</button>
                <button onClick={unsubscribe}>Unsubscribe</button>
                <Status status={status} />
            </Container>
        </Page>
    );
}
