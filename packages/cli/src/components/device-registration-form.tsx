import type { DeviceRegistration } from "@overdrip/core";
import { Form, type FormStructure } from "ink-form";
import AuthRequired from "./auth-required";

type Props = {
  onSubmit: (form: object) => void;
  defaultValues?: Partial<DeviceRegistration>;
};

const DeviceRegistrationForm = ({ onSubmit, defaultValues }: Props) => {
  const form: FormStructure = {
    sections: [
      {
        title: "Register Device",
        fields: [
          {
            name: "name",
            label: "Device Name",
            placeholder: "My Device",
            initialValue: defaultValues?.name,
            type: "string",
          },
        ],
      },
    ],
  };

  return (
    <AuthRequired>
      <Form form={form} onSubmit={onSubmit} />
    </AuthRequired>
  );
};

export default DeviceRegistrationForm;
