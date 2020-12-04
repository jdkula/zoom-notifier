import CarrierMapping from '~/lib/carriers.json';

export function phoneToEmail(phone: string, carrier: string): string {
    return phone + CarrierMapping[carrier];
}
