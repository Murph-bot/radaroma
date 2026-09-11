import { describe, expect, it } from "vitest"
import { isBlockedHostname } from "./net"

describe("isBlockedHostname", () => {
  it("blocks localhost and local aliases", () => {
    expect(isBlockedHostname("localhost")).toBe(true)
    expect(isBlockedHostname("LOCALHOST")).toBe(true)
    expect(isBlockedHostname("dev.localhost")).toBe(true)
    expect(isBlockedHostname("printer.local")).toBe(true)
  })

  it("blocks private IP ranges", () => {
    expect(isBlockedHostname("127.0.0.1")).toBe(true)
    expect(isBlockedHostname("10.0.0.5")).toBe(true)
    expect(isBlockedHostname("192.168.1.1")).toBe(true)
    expect(isBlockedHostname("172.16.0.1")).toBe(true)
    expect(isBlockedHostname("172.31.255.255")).toBe(true)
    expect(isBlockedHostname("169.254.169.254")).toBe(true)
    expect(isBlockedHostname("0.0.0.0")).toBe(true)
    expect(isBlockedHostname("::1")).toBe(true)
  })

  it("allows public hosts", () => {
    expect(isBlockedHostname("example.com")).toBe(false)
    expect(isBlockedHostname("8.8.8.8")).toBe(false)
    expect(isBlockedHostname("maps.google.com")).toBe(false)
  })

  it("does not block 172.32+ (public range)", () => {
    expect(isBlockedHostname("172.32.0.1")).toBe(false)
  })
})
