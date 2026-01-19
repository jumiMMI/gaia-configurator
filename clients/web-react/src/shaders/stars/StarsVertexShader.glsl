attribute float randomScale;
attribute float randomBrightness;
attribute float randomTimeOffset;

uniform float pointSize;

varying float vBrightness;
varying float vTimeOffset;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float depth = -mvPosition.z;
    gl_PointSize = pointSize * (100.0 / depth) * randomScale;
    gl_Position = projectionMatrix * mvPosition;

    vBrightness = randomBrightness;
    vTimeOffset = randomTimeOffset;
}