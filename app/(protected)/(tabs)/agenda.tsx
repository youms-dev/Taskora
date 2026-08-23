import { Calendar } from "@/components/agenda/calendar";
import { Container } from "@/components/container";
import { event, EXPAND_NAVBAR, MINIMIZE_NAVBAR } from "@/lib/event-emitter";
import { usePathname } from "expo-router";
import { useEffect } from "react";

export default function Agenda() {
    const pathname = usePathname();

    useEffect(() => {
        if (pathname == "/agenda") {
            event.emit(MINIMIZE_NAVBAR);
        }

        return () => {
            event.emit(EXPAND_NAVBAR);
        }
    }, [pathname]);

    return (
        <Container centerX>
            <Calendar />
        </Container>
    );
}