import { useState } from 'react';

export function useSimpleGame() {
    const [state, setState] = useState(0);
    return { state, setState };
}
