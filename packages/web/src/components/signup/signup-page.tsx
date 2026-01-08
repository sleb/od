import { signUpUser } from "@overdrip/core/user";
import {
  Anchor,
  Button,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthFormLayout from "../auth/auth-form-layout";

type SignUpForm = {
  email: string;
  password: string;
  confirmPassword: string;
};

const SignUpPage = () => {
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<SignUpForm>({
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validate: {
      email: (value) => {
        if (!value) return "Email is required";
        if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
          return "Invalid email address";
        }
        return null;
      },
      password: (value) => {
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return null;
      },
      confirmPassword: (value, values) => {
        if (!value) return "Please confirm your password";
        if (value !== values.password) return "Passwords do not match";
        return null;
      },
    },
  });

  const handleSubmit = async (values: SignUpForm) => {
    setAuthError(null);
    setAuthSuccess(false);
    setIsSubmitting(true);

    try {
      await signUpUser(values.email, values.password);
      setAuthSuccess(true);
      navigate("/");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to create account. Please try again.";
      setAuthError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormLayout
      title="Create your account"
      subtitle="Sign up to start managing your plant watering"
      error={authError}
      success={authSuccess ? "Account created successfully!" : null}
    >
      <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
        <Stack gap="md">
          <TextInput
            label="Email address"
            placeholder="your@email.com"
            type="email"
            autoComplete="email"
            {...form.getInputProps("email")}
          />

          <PasswordInput
            label="Password"
            placeholder="Create a password"
            autoComplete="new-password"
            {...form.getInputProps("password")}
          />

          <PasswordInput
            label="Confirm password"
            placeholder="Confirm your password"
            autoComplete="new-password"
            {...form.getInputProps("confirmPassword")}
          />

          <Button type="submit" fullWidth loading={isSubmitting} mt="sm">
            Create account
          </Button>

          <Text ta="center" size="sm" c="dimmed">
            Already have an account?{" "}
            <Anchor href="/login" c="blue">
              Sign in
            </Anchor>
          </Text>
        </Stack>
      </form>
    </AuthFormLayout>
  );
};

export default SignUpPage;
