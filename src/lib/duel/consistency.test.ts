import { describe, it, expect } from "vitest";
import { SCENARIOS, SCENARIO_IDS } from "./scenarios";
import { CLIENT_SCENARIOS, CLIENT_SCENARIO_IDS } from "./scenarios-client";

describe("scenario consistency: client brief matches server data", () => {
  it("client and server have the same scenario IDs", () => {
    expect(CLIENT_SCENARIO_IDS.sort()).toEqual([...SCENARIO_IDS].sort());
  });

  for (const id of SCENARIO_IDS) {
    describe(id, () => {
      const server = SCENARIOS[id];
      const client = CLIENT_SCENARIOS[id];

      it("product matches", () => {
        expect(client.product).toBe(server.product);
      });

      it("buyer name matches", () => {
        expect(client.buyer.name).toBe(server.buyer.name);
      });

      it("buyer role matches", () => {
        expect(client.buyer.role).toBe(server.buyer.role);
      });

      it("buyer company matches", () => {
        expect(client.buyer.company).toBe(server.buyer.company);
      });

      it("buyer companyBrief matches", () => {
        expect(client.buyer.companyBrief).toBe(server.buyer.companyBrief);
      });

      it("sellerStrength matches", () => {
        expect(client.sellerStrength).toBe(server.sellerStrength);
      });

      it("server buyer has company field (prompt won't crash)", () => {
        expect(server.buyer.company).toBeTruthy();
        expect(server.buyer.companyBrief).toBeTruthy();
      });
    });
  }
});
