export function formatString(entry: string) {
    return (entry
        .toLowerCase()
        .split(" ")
        .map(l => l.charAt(0).toUpperCase() + l.slice(1))
        .join(" ")
    );
}