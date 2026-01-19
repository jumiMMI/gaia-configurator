uniform float uTime;

varying float vBrightness;
varying float vTimeOffset;

void main() {
    vec3 color = vec3(1.0);

    float dist = length(gl_PointCoord - vec2(0.5));
    float alpha = smoothstep(0.5, 0., dist);
    alpha *= (vBrightness + sin(uTime + vTimeOffset));

    gl_FragColor = vec4(color, alpha);
}