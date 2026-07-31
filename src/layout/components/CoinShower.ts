import { Container, Sprite, Texture, Ticker, type PointData } from 'pixi.js';
import { settingsVisual } from 'config/visual.settings';

const physics = settingsVisual.coins;

type Coin = {
    sprite: Sprite;
    vx: number;
    vy: number;
    size: number;
    flip: number;
    spin: number;
    life: number;
};

// Nothing is pooled or capped: a coin is only ever in the air for its life,
// so the shower can only be as thick as the count that drops them is fast.
export class CoinShower extends Container {
    #coins: Coin[] = [];

    drop({ x, y }: PointData) {
        const size = physics.size * (1 + Math.random());
        const sprite = new Sprite({
            texture: Texture.from('coin'),
            anchor: 0.5,
            x,
            y,
        });
        const angle = -Math.PI / 2 + (Math.random() * 2 - 1) * physics.spread;
        const speed = physics.speed * (1 + Math.random());

        sprite.scale.set(size);

        this.addChild(sprite);
        this.#coins.push({
            sprite,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size,
            // Somewhere into the flip already, so no two coins turn together.
            flip: Math.random(),
            spin: physics.spin * (1 + Math.random() / 2),
            life: physics.life,
        });

        if (this.#coins.length === 1) Ticker.shared.add(this.fall, this);
    }

    clear() {
        Ticker.shared.remove(this.fall, this);

        for (const { sprite } of this.#coins) sprite.destroy();

        this.#coins = [];
    }

    private fall({ deltaMS }: Ticker) {
        const seconds = deltaMS / 1000;

        this.#coins = this.#coins.filter((coin) => {
            const { sprite } = coin;

            coin.life -= seconds;

            if (coin.life <= 0) {
                sprite.destroy();

                return false;
            }

            coin.vy += physics.gravity * seconds;
            coin.flip += coin.spin * seconds;

            sprite.x += coin.vx * seconds;
            sprite.y += coin.vy * seconds;
            // Spins about its own upright rather than rolling over, so the
            // face turns away to an edge and comes back.
            sprite.scale.x = coin.size * Math.cos(coin.flip * Math.PI * 2);
            sprite.alpha = Math.min(coin.life / physics.fade, 1);

            return true;
        });

        if (!this.#coins.length) Ticker.shared.remove(this.fall, this);
    }
}
