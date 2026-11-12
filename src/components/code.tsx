import { Body, Container, Head, Heading, Html, Img, Preview, Section, Text } from 'react-email';
import { Base } from './base';
import { Footer } from './footer';
import { Header } from './header';

interface CodeMailProps {
  code: string | number;
  language?: "fr" | "en";
  expireIn: number;
  name?: string;
}

export const CodeMail = ({ code = 12345, language, expireIn = 5, name }: CodeMailProps) => (
  <Html>
    <Head />

    <Base>
      <Preview>
        {String(code)}
      </Preview>

      <Body className="bg-white font-sans">

        <Container className="mx-auto mt-5 max-w-[360px] rounded-[5px] border border-[#eee] bg-white py-[68px] pb-10 shadow-lg shadow-primary/10 px-3">
          <Header />

          <Heading className="mx-2 mt-4 h-4 text-center text-lg font-bold uppercase leading-4 tracking-normal mb-5">
            {language == "fr" ? "Code de vérification" : "Verification code"}
          </Heading>

          <Text>
            {language == "fr" ?
              `Bonjour ${name} ;`
              :
              `Hi there ;`
            }
          </Text>

          <Text className="">
            {language == "fr" ?
              `Le code ci dessous est à usage unique et expire dans ${expireIn} minutes.`
              :
              `This is a one-time code and it will expire in ${expireIn} minutes.`
            }
          </Text>

          <Section className="mx-auto my-5 mb-[14px] w-[280px] rounded bg-primary/5 align-middle">
            <Text className="mx-auto my-0 inline-block w-full py-2 text-center font-bold text-[32px] leading-10 tracking-[6px] text-primary">
              {code}
            </Text>
          </Section>

          <Text className="m-0 px-10 text-center leading-[23px] tracking-normal text-[#444]">
            {
              language == "fr" ?
                "Si vous n'êtes pas à l'origine de cette requête, ignorez simplement ce mail."
                :
                "If you don't requested for this code, ignore this mail."
            }
          </Text>

          <Footer language={language} />
        </Container>
      </Body>
    </Base>
  </Html>
);

export default CodeMail;