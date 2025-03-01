export function MergeRecursive(obj1: { [x: string]: any; }, obj2: { [x: string]: any; }) {

    for (var p in obj2) {
        try {
            // Property in destination object set; update its value.
            if (obj2[p].constructor == Object) {
                obj1[p] = MergeRecursive(obj1[p], obj2[p]);

            } else {
                obj1[p] = obj2[p];

            }

        } catch (e) {
            // Property in destination object not set; create it and set its value.
            obj1[p] = obj2[p];

        }
    }

    return obj1;
}

export function prettyBytes(bytes: number): string {
    if (bytes < (1024 * 1024)) {
        const kib = bytes / 1024;
        return `${kib} KiB`;
    }

    const mib = bytes / 1024 / 1024;
    return `${mib} MiB`;

}