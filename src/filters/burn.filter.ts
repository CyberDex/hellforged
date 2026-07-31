import {
    Filter,
    GlProgram,
    Ticker,
    UniformGroup,
    defaultFilterVert,
} from 'pixi.js';
import fragment from './burn.shader.glsl?raw';

// Self-animating off the shared ticker; just assign it to `filters`.
export class BurnFilter extends Filter {
    readonly #uniforms: UniformGroup;

    constructor(intensity = 0.5) {
        const uniforms = new UniformGroup({
            uTime: { value: 0, type: 'f32' },
            uIntensity: { value: intensity, type: 'f32' },
        });

        super({
            glProgram: GlProgram.from({ vertex: defaultFilterVert, fragment }),
            resources: { burnUniforms: uniforms },
        });

        this.#uniforms = uniforms;

        Ticker.shared.add(this.#tick);
    }

    #time = 0;

    readonly #tick = ({ deltaMS }: Ticker) => {
        this.#time += deltaMS / 1000;
        this.#uniforms.uniforms.uTime = this.#time;
    };
}
