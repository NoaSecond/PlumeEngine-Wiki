
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        fileParallelism: false, // Avoid conflicts with single DB file if we add more tests
    },
});
