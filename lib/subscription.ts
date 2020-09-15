export default interface Subscription {
    _id?: string;
    start: boolean;
    end: boolean;
    email: string | null;
}
