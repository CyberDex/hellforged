in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec4 uInputClamp;

uniform float uTime;
uniform float uIntensity;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = smoothstep(0.0, 1.0, fract(p));

    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
    );
}

// Three octaves, stretched vertically and scrolling up: heat rising.
float flame(vec2 uv, float scale, float speed) {
    vec2 p = vec2(uv.x * scale, uv.y * scale * 0.5 + uTime * speed);

    return noise(p) * 0.6 + noise(p * 2.3) * 0.3 + noise(p * 4.7) * 0.1;
}

void main(void) {
    // 0..1 across the sprite, whatever the filter texture padding is.
    vec2 uv = vTextureCoord / uInputClamp.zw;

    float slow = flame(uv, 9.0, 0.15);
    float fast = flame(uv, 22.0, 0.4);

    // Everything builds towards the bottom, as if the fire were down there.
    float heat = mix(0.3, 1.0, uv.y);

    // Melt: sag the picture along the noise.
    vec2 melt = vec2(slow - 0.5, fast - 0.5) * 0.012 * heat * uIntensity;
    vec2 coord = clamp(vTextureCoord + melt, uInputClamp.xy, uInputClamp.zw);
    vec4 color = texture(uTexture, coord);

    // Char: soot where the noise thins out.
    color.rgb *= 1.0 - 0.35 * smoothstep(0.5, 0.15, fast) * heat * uIntensity;

    // Embers: warm glow pooling low down.
    float ember = smoothstep(0.35, 0.9, slow * fast * 2.6) * pow(uv.y, 1.5);
    float flicker = 0.8 + 0.2 * sin(uTime * 3.7 + slow * 20.0);
    vec3 fire = mix(vec3(0.9, 0.25, 0.05), vec3(1.0, 0.7, 0.25), ember);

    color.rgb += fire * ember * flicker * 0.7 * uIntensity * color.a;

    finalColor = color;
}
