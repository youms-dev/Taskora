export const Response = (message: string, status: number = 200) => {
    return {
        message, status
    }
}