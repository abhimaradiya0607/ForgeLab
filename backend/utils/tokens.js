import crypto from 'node:crypto';

export const TOKEN_PREFIX = 'flab_';

// A random token shown to the user once
export function generateToken() {
    return TOKEN_PREFIX + crypto.randomBytes(32).toString('hex');
}

// Only this hash is stored in the database
export function hashToken(raw) {
    return crypto.createHash('sha256').update(raw).digest('hex');
}