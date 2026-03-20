import { buildSlotTimeIso, canBookSlot, cancelAppointment } from "@/lib/booking/service";

describe("booking service", () => {
  it("prevents doctor slot double booking", () => {
    const appts = [
      {
        id: "1",
        patientId: "p1",
        doctorId: "d1",
        slotTime: "2026-05-01T09:00:00.000Z",
        status: "scheduled" as const
      }
    ];
    expect(canBookSlot(appts, "d1", "2026-05-01T09:00:00.000Z")).toBe(false);
  });

  it("cancels selected appointment", () => {
    const appts = [
      {
        id: "1",
        patientId: "p1",
        doctorId: "d1",
        slotTime: "2026-05-01T09:00:00.000Z",
        status: "scheduled" as const
      }
    ];
    const result = cancelAppointment(appts, "1");
    expect(result[0].status).toBe("cancelled");
  });

  it("builds ISO slot timestamp from date and time", () => {
    const slotTime = buildSlotTimeIso("2026-05-01", "09:00");
    expect(slotTime).toBe("2026-05-01T09:00:00.000Z");
  });
});
