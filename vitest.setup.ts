import { vi } from "vitest";

vi.mock("*.css", () => ({ default: {} }));
vi.mock("*.module.css", () => ({ default: {} }));
