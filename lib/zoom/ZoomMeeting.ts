export default interface ZoomMeeting {
    uuid: string;
    id: number;
    host_id: string;
    assistant_id: string;
    host_email: string;
    topic: string;
    type: number;
    status: string;
    start_time: string;
    duration: number;
    timezone: string;
    created_at: string;
    agenda: string;
    join_url: string;
    pmi?: string;
}
