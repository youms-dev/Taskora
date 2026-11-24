import { Container, Link, Text } from "react-email";
import { APP_NAME } from "src/constants/names";

interface Props {
    language?: "fr" | "en";
}

const Dashs = () => {
    return Array(10).fill(0).map((_, i) => <>&mdash;&nbsp;</>)
};

export const Footer = ({ language }: Props) => {
    return (
        <Container>
            <Text>
                <Dashs />
            </Text>

            <Text>
                {language == "fr" ? "Cordialement" : "Best regards"},
            </Text>

            <Text>
                Email :
                &nbsp;
                <Link href={`mailto: "${APP_NAME} support" <${process.env.APP_EMAIL}>`}>
                    {process.env.APP_EMAIL}
                </Link>
            </Text>

            <Text>
                {
                    language == "fr" ?
                        "Site web"
                        :
                        "Website"
                } :
                &nbsp;
                <Link href={process.env.APP_WEBSITE}>
                    {process.env.APP_WEBSITE}
                </Link>
            </Text>

            <Text>
                {
                    language == "fr" ?
                        "Développeur"
                        :
                        "Developer"
                } :
                &nbsp;
                {process.env.DEVELOPER_NAME}
            </Text>

            <Text>
                {
                    language == "fr" ?
                        "Email du développeur"
                        :
                        "Developer email"
                } :
                &nbsp;
                <Link href={`mailto:"${process.env.DEVELOPER_NAME}" <${process.env.DEVELOPER_EMAIL}>`}>
                    {process.env.DEVELOPER_EMAIL}
                </Link>
            </Text>

            <Text>
                Contact :
                &nbsp;
                <Link href={`tel:${String(process.env.DEVELOPER_CONTACT).toLowerCase().replaceAll("\s", "")}`}>
                    {process.env.DEVELOPER_CONTACT}
                </Link>
            </Text>

            <Text>
                <Dashs />
            </Text>
        </Container>
    );
};