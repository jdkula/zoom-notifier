const base64 = (data: string): string => {
    return Buffer.from(data).toString("base64");
};

export default base64;
