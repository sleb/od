import { logIn } from "@overdrip/core";
import { Form, type FormStructure } from "ink-form";
import { z } from "zod";

const FormSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

const LoginForm = () => {
  const handleLogin = (form: object) => {
    const { email, password } = FormSchema.parse(form);
    logIn(email, password).catch(console.error);
  };

  const form: FormStructure = {
    sections: [
      {
        title: "Please log in to continue",
        fields: [
          {
            name: "email",
            label: "Email",
            placeholder: "foo@bar.com",
            type: "string",
          },
          {
            name: "password",
            label: "Password",
            placeholder: "password",
            type: "string",
            mask: "*",
          },
        ],
      },
    ],
  };

  return <Form form={form} onSubmit={handleLogin} />;
};

export default LoginForm;
