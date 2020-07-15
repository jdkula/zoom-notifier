export default interface Subscription {
    _id?: string;
    subscription: PushSubscription;
    start: boolean;
    end: boolean;
}
