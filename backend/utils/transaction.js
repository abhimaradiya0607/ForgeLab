import mongoose from 'mongoose';

// Runs several writes as one all-or-nothing unit.
// If any step throws, every write in the block is rolled back.
export async function runInTransaction(work) {
    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            result = await work(session);
        });

        return result;
    } finally {
        await session.endSession();
    }
}