// Turns any thrown error into one clear line and a non-zero exit code
export const run = (fn) => async (argv) => {
    try {
        await fn(argv);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exitCode = 1;
    }
};
