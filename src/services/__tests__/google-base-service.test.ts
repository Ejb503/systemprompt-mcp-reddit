import { jest } from "@jest/globals";
import { GoogleAuthService } from "../google-auth-service";
import { GoogleBaseService } from "../google-base-service";
import { OAuth2Client } from "google-auth-library";

jest.mock("../google-auth-service");

class TestGoogleService extends GoogleBaseService {
  constructor() {
    super();
  }

  public async testInit(): Promise<void> {
    await this.waitForInit();
  }
}

describe("GoogleBaseService", () => {
  let mockAuth: jest.Mocked<GoogleAuthService>;
  let service: TestGoogleService;

  beforeEach(() => {
    mockAuth = {
      initialize: jest.fn().mockImplementation(() => Promise.resolve()),
      authenticate: jest.fn().mockImplementation(() => Promise.resolve()),
      getAuth: jest.fn().mockReturnValue(new OAuth2Client()),
      saveToken: jest.fn().mockImplementation(() => Promise.resolve()),
    } as unknown as jest.Mocked<GoogleAuthService>;

    (GoogleAuthService.getInstance as jest.Mock).mockReturnValue(mockAuth);
    service = new TestGoogleService();
  });

  it("should initialize successfully", async () => {
    await expect(service.testInit()).resolves.not.toThrow();
    expect(mockAuth.initialize).toHaveBeenCalled();
    expect(mockAuth.authenticate).toHaveBeenCalled();
  });

  it("should handle initialization failure", async () => {
    mockAuth.initialize.mockRejectedValueOnce(new Error("Init failed"));
    await expect(service.testInit()).rejects.toThrow("Init failed");
  });

  it("should handle authentication failure", async () => {
    mockAuth.authenticate.mockRejectedValueOnce(new Error("Auth failed"));
    await expect(service.testInit()).rejects.toThrow("Auth failed");
  });
});
