import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const GLOBAL_DIR = path.join(os.homedir(), '.forgelab');
const GLOBAL_FILE = path.join(GLOBAL_DIR, 'config.json');
const DEFAULT_API = 'https://forgelab-api-qooa.onrender.com';

export async function readGlobalConfig() {
    try {
        return JSON.parse(await fs.readFile(GLOBAL_FILE, 'utf8'));
    } catch {
        return {};
    }
}

// mode 0600: only your user account can read the token file
export async function writeGlobalConfig(data) {
    await fs.mkdir(GLOBAL_DIR, { recursive: true });
    await fs.writeFile(GLOBAL_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
}

export async function getApiUrl() {
    return process.env.FORGELAB_API || (await readGlobalConfig()).apiUrl || DEFAULT_API;
}

// FORGELAB_TOKEN lets scripts use a token without a saved login
export async function getToken() {
    return process.env.FORGELAB_TOKEN || (await readGlobalConfig()).token;
}

export async function requireToken() {
    const token = await getToken();
    if (!token) throw new Error('Not logged in. Run: forgelab login');
    return token;
}

export async function readRepoConfig() {
    const file = path.join(process.cwd(), '.ForgeLab', 'config.json');
    try {
        const config = JSON.parse(await fs.readFile(file, 'utf8'));
        if (!config.repoId) throw new Error('no repoId');
        return config;
    } catch {
        throw new Error('This folder is not a ForgeLab repo. Run: forgelab init <repoId>');
    }
}

export async function writeRepoConfig(repoId) {
    const dir = path.join(process.cwd(), '.ForgeLab');
    await fs.mkdir(path.join(dir, 'commits'), { recursive: true });
    await fs.writeFile(path.join(dir, 'config.json'), JSON.stringify({ repoId }, null, 2));
}
