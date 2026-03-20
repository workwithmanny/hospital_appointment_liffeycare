import { assertRole } from "@/lib/auth/guards";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("redirected");
  })
}));

describe("auth guards", () => {
  it("passes for allowed role", () => {
    expect(() =>
      assertRole(
        { id: "1", email: "a@b.com", role: "patient", doctorApproved: true, emailConfirmed: true },
        ["patient"]
      )
    ).not.toThrow();
  });

  it("redirects for denied role", () => {
    expect(() =>
      assertRole(
        { id: "1", email: "a@b.com", role: "patient", doctorApproved: true, emailConfirmed: true },
        ["admin"]
      )
    ).toThrow("redirected");
  });
});
