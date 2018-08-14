// @flow

export type CrossFaded<T> = {
    to: T,
    from: T,
    fromScale: number,
    toScale: number,
    t: number
};
