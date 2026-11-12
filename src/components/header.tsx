import { Img, Section } from "react-email";
import { APP_NAME } from "src/constants/names";

export const Header = () => {
    return (
        <Section>
            <Img
                src={process.env.LOGO_URL}
                width="212"
                height="88"
                alt={`${APP_NAME} logo`}
                className="mx-auto size-[100px]"
            />
        </Section>
    );
};