import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { api } from '../lib/api.js';
import { readGlobalConfig, writeGlobalConfig, getApiUrl, requireToken } from '../lib/config.js';

export async function login() {
    const rl = readline.createInterface({ input, output });
    const token = (await rl.question('Paste your ForgeLab token: ')).trim();
    rl.close();

    if (!token.startsWith('flab_')) {
        throw new Error('That is not a ForgeLab token. Tokens start with flab_');
    }

    // Confirm the token works before saving it
    await api('GET', '/me', { token });

    await writeGlobalConfig({
        ...(await readGlobalConfig()),
        apiUrl: await getApiUrl(),
        token,
    });

    console.log('Logged in. Token saved to ~/.forgelab/config.json');
}

export async function logout() {
    const config = await readGlobalConfig();
    delete config.token;
    await writeGlobalConfig(config);
    console.log('Logged out.');
}

export async function whoami() {
    const token = await requireToken();
    await api('GET', '/me', { token });
    console.log('Token is valid.');
}
