// @flow

export type CrossFaded<T> = {
    from: 'min' | 'max',
    min: T,
    mid: T,
    max: T,
    fromScale: number,
    toScale: number,
    t: number
};
