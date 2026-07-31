import { describe, expect, it } from 'vitest';
import { selectBigWinStages } from './game.settings';

describe('selectBigWinStages', () => {
    it.each([
        { win: 999, titles: [] },
        { win: 1000, titles: ['BIG WIN'] },
        { win: 9999, titles: ['BIG WIN'] },
        { win: 10000, titles: ['BIG WIN', 'MEGA WIN'] },
        { win: 99999, titles: ['BIG WIN', 'MEGA WIN'] },
        { win: 100000, titles: ['BIG WIN', 'MEGA WIN', 'EPIC WIN'] },
    ])('selects configured stages for a $win win', ({ win, titles }) => {
        expect(selectBigWinStages(win).map(({ title }) => title)).toEqual(
            titles,
        );
    });
});
