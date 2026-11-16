export function fileDatas(file: string) {
    if (file.trim().length == 0) {
        throw new Error("File name can't be empty");
    }

    const ext = file.split(".").pop();
    const name = () => {
        const tab = file.split(".");
        let str = "";

        for (let i = 0; i < tab.length - 1; i++) {
            if (i < tab.length - 2) {
                str += tab[i] + ".";
            }
            else {
                str += tab[i];
            }
            return str;
        }
    }
    return { name: name(), ext };
}

export function checkLength(entry: string, [min, max]: [number, number | null]) {
    if (max && min >= max) {
        throw new Error("Invalid max value");
    }
    else if (entry.length >= min && ((max && entry.length <= max) || (!max))) {
        return true;
    }
    else {
        return false;
    }
}

export function checkPattern(entry: string, regex: RegExp) {
    return regex.test(entry);
}

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