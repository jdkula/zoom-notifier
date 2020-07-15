import { ReactElement, useEffect, useState } from "react";
import useServiceWorker from "~/lib/useServiceWorker";

export default function Status({ status }: { status: string | null }): ReactElement {
    return <div>{status}</div>;
}
