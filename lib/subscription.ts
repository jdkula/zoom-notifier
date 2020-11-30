export default interface Subscription {
    _id?: string;
    start: boolean;
    end: boolean;
    each_join: boolean;
    each_leave: boolean;
    email: string | null;
    phone: boolean;
    for: string;
}
