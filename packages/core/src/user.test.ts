import { describe, expect, test } from "bun:test";
import { UserSchema } from "./schemas";

describe("UserSchema", () => {
  test("validates valid user object with uid", () => {
    const user = { uid: "user-123" };
    const result = UserSchema.safeParse(user);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.uid).toBe("user-123");
    }
  });

  test("accepts long uid strings", () => {
    const user = {
      uid: "very-long-uid-string-with-many-characters-0123456789",
    };
    const result = UserSchema.safeParse(user);

    expect(result.success).toBe(true);
  });

  test("rejects user with empty uid string", () => {
    const user = { uid: "" };
    const result = UserSchema.safeParse(user);

    expect(result.success).toBe(false);
  });

  test("rejects user with missing uid", () => {
    const user = {};
    const result = UserSchema.safeParse(user);

    expect(result.success).toBe(false);
  });

  test("rejects user with null uid", () => {
    const user = { uid: null };
    const result = UserSchema.safeParse(user);

    expect(result.success).toBe(false);
  });

  test("rejects user with undefined uid", () => {
    const user = { uid: undefined };
    const result = UserSchema.safeParse(user);

    expect(result.success).toBe(false);
  });

  test("rejects user with numeric uid", () => {
    const user = { uid: 12345 };
    const result = UserSchema.safeParse(user);

    expect(result.success).toBe(false);
  });

  test("rejects user with object uid", () => {
    const user = { uid: { id: "123" } };
    const result = UserSchema.safeParse(user);

    expect(result.success).toBe(false);
  });

  test("allows extra properties beyond uid", () => {
    const user = { uid: "user-123", email: "test@example.com" };
    const result = UserSchema.safeParse(user);

    // Zod object schema is strict by default, so extra properties are stripped
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.uid).toBe("user-123");
      expect("email" in result.data).toBe(false);
    }
  });
});
