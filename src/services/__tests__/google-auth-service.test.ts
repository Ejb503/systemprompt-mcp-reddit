import { jest } from "@jest/globals";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { GoogleAuthService } from "../google-auth-service";
import * as fs from "fs";

jest.mock("googleapis");
jest.mock("google-auth-library");
jest.mock("fs");

describe("GoogleAuthService", () => {
  let mockOAuth2Client: jest.Mocked<OAuth2Client>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOAuth2Client = {
      setCredentials: jest.fn(),
    } as unknown as jest.Mocked<OAuth2Client>;

    const MockOAuth2Client = jest.fn(() => mockOAuth2Client);
    (google.auth.OAuth2 as unknown as jest.Mock) = MockOAuth2Client;
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify({
        installed: {
          client_id: "test-client-id",
          client_secret: "test-client-secret",
          redirect_uris: ["http://localhost"],
        },
      })
    );
  });

  describe("getInstance", () => {
    it("should create a singleton instance", () => {
      const instance1 = GoogleAuthService.getInstance();
      const instance2 = GoogleAuthService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("initialize", () => {
    it("should initialize OAuth2Client with credentials", async () => {
      const mockCredentials = {
        installed: {
          client_id: "test-client-id",
          client_secret: "test-client-secret",
          redirect_uris: ["http://localhost"],
        },
      };

      (fs.readFileSync as jest.Mock).mockReturnValueOnce(
        JSON.stringify(mockCredentials)
      );

      const service = GoogleAuthService.getInstance();
      await service.initialize();

      expect(google.auth.OAuth2).toHaveBeenCalledWith(
        "test-client-id",
        "test-client-secret",
        "http://localhost"
      );
    });

    it("should load existing token if available", async () => {
      const mockCredentials = {
        installed: {
          client_id: "test-client-id",
          client_secret: "test-client-secret",
          redirect_uris: ["http://localhost"],
        },
      };
      const mockToken = { access_token: "test-token" };

      (fs.readFileSync as jest.Mock)
        .mockReturnValueOnce(JSON.stringify(mockCredentials))
        .mockReturnValueOnce(JSON.stringify(mockToken));
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const service = GoogleAuthService.getInstance();
      await service.initialize();

      expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith(mockToken);
    });

    it("should handle missing credentials file", async () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error("File not found");
      });

      const service = GoogleAuthService.getInstance();
      await expect(service.initialize()).rejects.toThrow("File not found");
    });
  });

  describe("authenticate", () => {
    it("should skip authentication if token exists", async () => {
      const mockCredentials = {
        installed: {
          client_id: "test-client-id",
          client_secret: "test-client-secret",
          redirect_uris: ["http://localhost"],
        },
      };

      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify(mockCredentials)
      );
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const service = GoogleAuthService.getInstance();
      await service.initialize();
      await service.authenticate();

      expect(fs.existsSync).toHaveBeenCalled();
    });

    it("should throw error if OAuth2Client is not initialized", async () => {
      const service = GoogleAuthService.getInstance();
      await expect(service.authenticate()).rejects.toThrow(
        "Google authentication required"
      );
    });

    it("should throw error with instructions if no token exists", async () => {
      const mockCredentials = {
        installed: {
          client_id: "test-client-id",
          client_secret: "test-client-secret",
          redirect_uris: ["http://localhost"],
        },
      };

      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify(mockCredentials)
      );
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const service = GoogleAuthService.getInstance();
      await service.initialize();
      await expect(service.authenticate()).rejects.toThrow(
        "Google authentication required"
      );
    });
  });

  describe("getAuth", () => {
    it("should throw error if OAuth2Client is not initialized", () => {
      const service = GoogleAuthService.getInstance();
      service["oAuth2Client"] = null;
      expect(() => service.getAuth()).toThrow("OAuth2Client not initialized");
    });

    it("should return OAuth2Client if initialized", async () => {
      const service = GoogleAuthService.getInstance();
      const mockOAuth2Client = new OAuth2Client();
      service["oAuth2Client"] = mockOAuth2Client;
      expect(service.getAuth()).toBe(mockOAuth2Client);
    });
  });

  describe("saveToken", () => {
    it("should save token to file", async () => {
      const mockToken = { access_token: "test-token" };
      const service = GoogleAuthService.getInstance();
      await service.saveToken(mockToken);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(mockToken)
      );
    });
  });
});
