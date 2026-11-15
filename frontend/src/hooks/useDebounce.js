import { useEffect, useState } from 'react';

export default function useDebounce(value, delay = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);

        // If the value changes again before the timer ends, cancel the old timer
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}