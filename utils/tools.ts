export const dateGraduation = (date: Date) => {
    const currentDate = new Date();
    const value = new Date(date);

    if (
        value.getFullYear() === currentDate.getFullYear()
        &&
        value.getMonth() === currentDate.getMonth()
    ) {
        const diff = currentDate.getDate() - value.getDate();
        return `il y a ${diff} jour${diff > 0 ? "s" : ""}`;
    }
    else if (
        value.getFullYear() === currentDate.getFullYear()
        &&
        value.getMonth() !== currentDate.getMonth()
    ) {
        const diff = currentDate.getMonth() - value.getMonth();

        return `il y a ${diff + 1} mois`;
    }

    return `le ${value.toLocaleDateString()}`;
}

export const fileDatas = (file: string) => {
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

export const checkLength = (entry: string, [min, max]: [number, number | null]) => {
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

export const checkPattern = (entry: string, regex: RegExp) => {
    return regex.test(entry);
}