import { Body, Container, Head, Html, Section, Text } from 'react-email';
import { Base } from './base';
import { Footer } from './footer';
import { Header } from './header';

interface MessageMailProps {
  language?: "fr" | "en";
  message: string[] | string;
}

export const MessageMail = ({ language, message = ["Yo comment ça va ?", "Ecris mois en ib"] }: MessageMailProps) => (
  <Html>
    <Head />

    <Base>
      <Body className="bg-white font-sans">
        <Container className="mx-auto mt-5 max-w-[500px] rounded-[5px] border border-[#eee] bg-white py-[68px] pb-10 px-3">
          <Header />

          {
            typeof message == "string" ?
              (
                <Text className="">
                  {message}
                </Text>
              )
              :
              (
                <Section>
                  {
                    message.map((m, i) => (
                      <Text key={i}>
                        {m}
                      </Text>
                    ))
                  }
                </Section>
              )
          }

          <Footer language={language} />
        </Container>
      </Body>
    </Base>
  </Html>
);

export default MessageMail;