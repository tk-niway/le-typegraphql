import { Container } from "@mui/material";
import type { NextPage } from "next";
import GuestHeader from "../common/header/GuestHeader";
import OneColumn from "../common/layout/OneColumn";
import { centering_vertical } from "../../styles/common";
import {
  Sign_Title,
  Border_Or,
  Google_Button,
  Mail_Field,
  Password_Field,
  Sign_Submit,
} from "../../styles/sign-style";
import { Locale, useLocale } from "../../hooks/useLocal";

const SignIn: NextPage = () => {
  const { txt }: { txt: Locale } = useLocale();

  return (
    <OneColumn>
      <GuestHeader />

      <Container maxWidth="sm">
        <main css={centering_vertical}>
          <Sign_Title text={txt.signin_ruhuna} />

          <Google_Button text={txt.with_google} />

          <Border_Or />

          <Mail_Field text={txt.email} />
          <Password_Field text={txt.password} />

          <Sign_Submit text={txt.signin} />
        </main>
      </Container>

      <footer></footer>
    </OneColumn>
  );
};
export default SignIn;
