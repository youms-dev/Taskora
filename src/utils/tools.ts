export function formatString(entry: string) {
    return (entry
        .toLowerCase()
        .split(" ")
        .map(l => l.charAt(0).toUpperCase() + l.slice(1))
        .join(" ")
    );
}

export function randomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function handleGreeting(lng?: "en" | "fr") {
    const date = new Date();

    if(date.getHours() >= 0 && date.getHours() <= 12) {
        return lng && lng == "fr" ? "Bien le bonjour" : "Hi there";
    }
    else if(date.getHours() > 12 && date.getHours() <= 16) {
        return lng && lng == "fr" ? "Bon après-midi" : "Hi there";
    }
    else if(date.getHours() > 16 && date.getHours() <= 23) {
        return lng && lng == "fr" ? "Bonsoir" : "Hi there";
    }
}