export function createAvatar(entry: string) {
    const tab = entry.toLowerCase().split(" ");

    return (
        tab
            .map(l => l.charAt(0).toUpperCase())
            .filter((_, i, tab) => i == 0 || i == tab.length - 1)
            .join("")
            .trim()
    );
}

export function formatName(entry: string) {
    return (entry
        .toLowerCase()
        .split(" ")
        .map(l => l.charAt(0).toUpperCase() + l.slice(1))
        .join(" ")
    );
}
