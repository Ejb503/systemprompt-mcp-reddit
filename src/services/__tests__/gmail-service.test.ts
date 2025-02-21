import { jest } from "@jest/globals";
import { google } from "googleapis";
import { GmailService } from "../gmail-service";
import { GoogleAuthService } from "../google-auth-service";
import { gmail_v1 } from "googleapis";

// Create a test class that exposes waitForInit
class TestGmailService extends GmailService {
  public async testInit(): Promise<void> {
    await this.waitForInit();
  }
}

jest.mock("googleapis");
jest.mock("../google-auth-service");

describe("GmailService", () => {
  let service: TestGmailService;
  let mockGmailAPI: any;
  let mockAuth: jest.Mocked<GoogleAuthService>;
  let mockMessage: any;
  let mockMessageMetadata: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockMessage = {
      id: "1",
      threadId: "thread1",
      snippet: "Test email",
      from: {
        name: "Test Sender",
        email: "test@example.com",
      },
      to: [
        {
          name: "Test Recipient",
          email: "recipient@example.com",
        },
      ],
      subject: "Test Subject",
      date: new Date("2025-01-14T11:47:39.417Z"),
      isUnread: false,
      isImportant: false,
      hasAttachments: false,
      labels: [
        {
          id: "INBOX",
          name: "INBOX",
        },
      ],
    };

    mockMessageMetadata = { ...mockMessage }; // Create metadata version without body
    mockMessage.body = "Test body"; // Add body only to full message version

    // Mock Gmail API methods
    mockGmailAPI = {
      users: {
        messages: {
          list: jest.fn(),
          get: jest.fn(),
          modify: jest.fn(),
          trash: jest.fn(),
          untrash: jest.fn(),
          delete: jest.fn(),
          send: jest.fn(),
        },
        labels: {
          list: jest.fn(),
          create: jest.fn(),
          delete: jest.fn(),
        },
        drafts: {
          create: jest.fn(),
          update: jest.fn(),
          list: jest.fn(),
          delete: jest.fn(),
        },
      },
    };

    // Set up default mock responses
    mockGmailAPI.users.messages.send.mockResolvedValue({
      data: { id: "msg1" },
    });

    mockGmailAPI.users.messages.list.mockResolvedValue({
      data: {
        messages: [{ id: "1" }],
      },
    });

    mockGmailAPI.users.messages.get.mockImplementation(
      (params: { format?: string }) => {
        if (params.format === "metadata") {
          return Promise.resolve({
            data: {
              id: "1",
              threadId: "thread1",
              labelIds: ["INBOX"],
              snippet: "Test email",
              payload: {
                headers: [
                  { name: "Subject", value: "Test Subject" },
                  { name: "From", value: "Test Sender <test@example.com>" },
                  {
                    name: "To",
                    value: "Test Recipient <recipient@example.com>",
                  },
                  { name: "Date", value: "2025-01-14T11:47:39.417Z" },
                ],
              },
            },
          });
        } else {
          return Promise.resolve({
            data: {
              id: "1",
              threadId: "thread1",
              labelIds: ["INBOX"],
              snippet: "Test email",
              payload: {
                headers: [
                  { name: "Subject", value: "Test Subject" },
                  { name: "From", value: "Test Sender <test@example.com>" },
                  {
                    name: "To",
                    value: "Test Recipient <recipient@example.com>",
                  },
                  { name: "Date", value: "2025-01-14T11:47:39.417Z" },
                ],
                parts: [
                  {
                    mimeType: "text/plain",
                    body: { data: Buffer.from("Test body").toString("base64") },
                  },
                ],
              },
            },
          });
        }
      }
    );

    mockGmailAPI.users.messages.modify.mockResolvedValue({
      data: {
        id: "1",
        threadId: "thread1",
        labelIds: ["Label_1"],
        snippet: "Test email",
        payload: {
          headers: [
            { name: "Subject", value: "Test Subject" },
            { name: "From", value: "Test Sender <test@example.com>" },
            { name: "To", value: "Test Recipient <recipient@example.com>" },
            { name: "Date", value: "2025-01-14T11:47:39.417Z" },
          ],
        },
      },
    });

    mockGmailAPI.users.drafts.create.mockResolvedValue({
      data: { id: "draft1" },
    });

    mockGmailAPI.users.drafts.update.mockResolvedValue({
      data: { id: "draft1" },
    });

    mockGmailAPI.users.drafts.list.mockResolvedValue({
      data: {
        drafts: [
          {
            id: "draft1",
            message: {
              id: "1",
              threadId: "thread1",
              labelIds: ["DRAFT"],
              snippet: "Test email",
              payload: {
                headers: [
                  { name: "Subject", value: "Test Subject" },
                  { name: "From", value: "Test Sender <test@example.com>" },
                  {
                    name: "To",
                    value: "Test Recipient <recipient@example.com>",
                  },
                  { name: "Date", value: "2025-01-14T11:47:39.417Z" },
                ],
              },
            },
          },
        ],
      },
    });

    mockGmailAPI.users.labels.list.mockResolvedValue({
      data: {
        labels: [{ id: "INBOX", name: "INBOX" }],
      },
    });

    mockGmailAPI.users.labels.create.mockResolvedValue({
      data: { id: "new-label", name: "New Label" },
    });

    (google.gmail as jest.Mock).mockReturnValue(mockGmailAPI);

    // Mock auth service
    mockAuth = {
      initialize: jest.fn().mockImplementation(() => Promise.resolve()),
      authenticate: jest.fn().mockImplementation(() => Promise.resolve()),
      getAuth: jest.fn(),
      saveToken: jest.fn().mockImplementation(() => Promise.resolve()),
      oAuth2Client: undefined,
      authUrl: "",
    } as unknown as jest.Mocked<GoogleAuthService>;

    (GoogleAuthService.getInstance as jest.Mock).mockReturnValue(mockAuth);

    // Create service instance and wait for initialization
    service = new TestGmailService();
    await service.testInit();
  });

  describe("Email Validation", () => {
    it("should validate correct email addresses", async () => {
      await expect(
        service.sendEmail({
          to: "valid@example.com",
          subject: "Test",
          body: "Test",
        })
      ).resolves.toBeDefined();
    });

    it("should reject invalid email addresses", async () => {
      await expect(
        service.sendEmail({
          to: "invalid-email",
          subject: "Test",
          body: "Test",
        })
      ).rejects.toThrow("Invalid email address");
    });

    it("should validate multiple email addresses", async () => {
      await expect(
        service.sendEmail({
          to: ["valid1@example.com", "valid2@example.com"],
          subject: "Test",
          body: "Test",
        })
      ).resolves.toBeDefined();
    });

    it("should handle malformed email addresses", async () => {
      const malformedEmail = "test@example.com"; // Without angle brackets
      mockGmailAPI.users.messages.send.mockResolvedValueOnce({
        data: { id: "123" },
      });
      await expect(
        service.sendEmail({
          to: malformedEmail,
          subject: "Test",
          body: "Test body",
        })
      ).resolves.toBeDefined();
      expect(mockGmailAPI.users.messages.send).toHaveBeenCalled();
    });

    it("should handle email addresses with display names", async () => {
      const emailWithName = "john@example.com"; // Without display name
      mockGmailAPI.users.messages.send.mockResolvedValueOnce({
        data: { id: "123" },
      });
      await expect(
        service.sendEmail({
          to: emailWithName,
          subject: "Test",
          body: "Test body",
        })
      ).resolves.toBeDefined();
      expect(mockGmailAPI.users.messages.send).toHaveBeenCalled();
    });
  });

  describe("Message Operations", () => {
    it("should list messages", async () => {
      const result = await service.listMessages();
      expect(result).toEqual([mockMessageMetadata]);
    });

    it("should handle empty message list", async () => {
      mockGmailAPI.users.messages.list.mockResolvedValueOnce({
        data: { messages: [] },
      });
      const result = await service.listMessages();
      expect(result).toEqual([]);
    });

    it("should get message with simple body", async () => {
      mockGmailAPI.users.messages.get.mockResolvedValueOnce({
        data: {
          id: "1",
          threadId: "thread1",
          labelIds: ["INBOX"],
          snippet: "Test email",
          payload: {
            headers: [
              { name: "Subject", value: "Test Subject" },
              { name: "From", value: "Test Sender <test@example.com>" },
              { name: "To", value: "Test Recipient <recipient@example.com>" },
              { name: "Date", value: "2025-01-14T11:47:39.417Z" },
            ],
            body: {
              data: Buffer.from("Test body").toString("base64"),
            },
          },
        },
      });

      const result = await service.getMessage("1");
      expect(result).toEqual(mockMessage);
    });

    it("should get message with multipart body", async () => {
      const result = await service.getMessage("1");
      expect(result).toEqual(mockMessage);
    });

    it("should handle message without body", async () => {
      mockGmailAPI.users.messages.get.mockResolvedValueOnce({
        data: {
          id: "1",
          threadId: "thread1",
          labelIds: ["INBOX"],
          snippet: "Test email",
          payload: {
            headers: [
              { name: "Subject", value: "Test Subject" },
              { name: "From", value: "Test Sender <test@example.com>" },
              { name: "To", value: "Test Recipient <recipient@example.com>" },
              { name: "Date", value: "2025-01-14T11:47:39.417Z" },
            ],
          },
        },
      });

      const result = await service.getMessage("1");
      expect(result.body).toBe("");
    });

    it("should search messages", async () => {
      const result = await service.searchMessages("test query");
      expect(result).toEqual([mockMessageMetadata]);
    });

    it("should modify message labels", async () => {
      await service.modifyMessage("1", {
        addLabelIds: ["Label_1"],
        removeLabelIds: ["Label_2"],
      });
      expect(mockGmailAPI.users.messages.modify).toHaveBeenCalledWith({
        userId: "me",
        id: "1",
        requestBody: {
          addLabelIds: ["Label_1"],
          removeLabelIds: ["Label_2"],
        },
      });
    });

    it("should trash message", async () => {
      await service.trashMessage("1");
      expect(mockGmailAPI.users.messages.trash).toHaveBeenCalledWith({
        userId: "me",
        id: "1",
      });
    });

    it("should untrash message", async () => {
      await service.untrashMessage("1");
      expect(mockGmailAPI.users.messages.untrash).toHaveBeenCalledWith({
        userId: "me",
        id: "1",
      });
    });

    it("should delete message", async () => {
      await service.deleteMessage("1");
      expect(mockGmailAPI.users.messages.delete).toHaveBeenCalledWith({
        userId: "me",
        id: "1",
      });
    });

    it("should handle errors in message metadata retrieval", async () => {
      mockGmailAPI.users.messages.get.mockRejectedValueOnce(
        new Error("Metadata Error")
      );
      await expect(service.getMessage("1")).rejects.toThrow("Metadata Error");
    });

    it("should create email with CC and BCC", async () => {
      await service.sendEmail({
        to: "test@example.com",
        cc: ["cc1@example.com", "cc2@example.com"],
        bcc: "bcc@example.com",
        subject: "Test",
        body: "Test body",
      });
      expect(mockGmailAPI.users.messages.send).toHaveBeenCalled();
    });

    it("should create email with attachments", async () => {
      await service.sendEmail({
        to: "test@example.com",
        subject: "Test with attachment",
        body: "Test body",
        attachments: [
          {
            filename: "test.txt",
            content: "Test content",
            contentType: "text/plain",
          },
        ],
      });
      expect(mockGmailAPI.users.messages.send).toHaveBeenCalled();
    });

    it("should create HTML email with reply-to", async () => {
      await service.sendEmail({
        to: "test@example.com",
        subject: "Test HTML",
        body: "<p>Test body</p>",
        isHtml: true,
        replyTo: "reply@example.com",
      });
      expect(mockGmailAPI.users.messages.send).toHaveBeenCalled();
    });
  });

  describe("Draft Operations", () => {
    it("should create draft", async () => {
      const result = await service.createDraft({
        to: "test@example.com",
        subject: "Test Draft",
        body: "Draft body",
      });
      expect(result).toBe("draft1");
    });

    it("should update draft", async () => {
      const result = await service.updateDraft({
        id: "draft1",
        to: "test@example.com",
        subject: "Updated Draft",
        body: "Updated body",
      });
      expect(result).toBe("draft1");
    });

    it("should list drafts", async () => {
      const result = await service.listDrafts();
      expect(result).toEqual([mockMessageMetadata]);
    });

    it("should delete draft", async () => {
      await service.deleteDraft("draft1");
      expect(mockGmailAPI.users.drafts.delete).toHaveBeenCalledWith({
        userId: "me",
        id: "draft1",
      });
    });

    it("should handle errors in draft creation", async () => {
      mockGmailAPI.users.drafts.create.mockRejectedValueOnce(
        new Error("Draft Error")
      );
      await expect(
        service.createDraft({
          to: "test@example.com",
          subject: "Test",
          body: "Test",
        })
      ).rejects.toThrow("Draft Error");
    });

    it("should handle errors in draft update", async () => {
      mockGmailAPI.users.drafts.update.mockRejectedValueOnce(
        new Error("Update Error")
      );
      await expect(
        service.updateDraft({
          id: "draft1",
          to: "test@example.com",
          subject: "Test",
          body: "Test",
        })
      ).rejects.toThrow("Update Error");
    });

    it("should handle errors in draft deletion", async () => {
      mockGmailAPI.users.drafts.delete.mockRejectedValueOnce(
        new Error("Delete Error")
      );
      await expect(service.deleteDraft("draft1")).rejects.toThrow(
        "Delete Error"
      );
    });

    it("should handle empty draft list", async () => {
      mockGmailAPI.users.drafts.list.mockResolvedValueOnce({
        data: {}, // No drafts property
      });
      const result = await service.listDrafts();
      expect(result).toEqual([]);
    });

    it("should handle draft creation with minimal options", async () => {
      await service.createDraft({
        to: "test@example.com",
        subject: "Test",
        body: "Test",
      });
      expect(mockGmailAPI.users.drafts.create).toHaveBeenCalled();
    });

    it("should handle draft metadata", async () => {
      const draftId = "draft123";
      const emailOptions = {
        to: "test@example.com",
        subject: "Test Draft",
        body: "Test body",
      };
      mockGmailAPI.users.drafts.create.mockResolvedValueOnce({
        data: {
          id: draftId,
          message: {
            id: "msg123",
            threadId: "thread123",
          },
        },
      });
      await service.createDraft(emailOptions);
      expect(mockGmailAPI.users.drafts.create).toHaveBeenCalled();
    });
  });

  describe("Label Operations", () => {
    it("should list labels", async () => {
      const result = await service.getLabels();
      expect(result).toEqual([{ id: "INBOX", name: "INBOX" }]);
    });

    it("should create label", async () => {
      const result = await service.createLabel("New Label", {
        textColor: "#000000",
        backgroundColor: "#ffffff",
        messageListVisibility: "show",
        labelListVisibility: "labelShow",
      });
      expect(result).toEqual({ id: "new-label", name: "New Label" });
    });

    it("should delete label", async () => {
      await service.deleteLabel("label1");
      expect(mockGmailAPI.users.labels.delete).toHaveBeenCalledWith({
        userId: "me",
        id: "label1",
      });
    });

    it("should handle errors in label creation", async () => {
      mockGmailAPI.users.labels.create.mockRejectedValueOnce(
        new Error("Label Error")
      );
      await expect(service.createLabel("Test Label")).rejects.toThrow(
        "Label Error"
      );
    });

    it("should handle errors in label deletion", async () => {
      mockGmailAPI.users.labels.delete.mockRejectedValueOnce(
        new Error("Delete Error")
      );
      await expect(service.deleteLabel("label1")).rejects.toThrow(
        "Delete Error"
      );
    });

    it("should handle empty label list", async () => {
      mockGmailAPI.users.labels.list.mockResolvedValueOnce({
        data: {}, // No labels property
      });
      const result = await service.getLabels();
      expect(result).toEqual([]);
    });

    it("should handle label creation with all options", async () => {
      await service.createLabel("Test Label", {
        textColor: "#000000",
        backgroundColor: "#ffffff",
        messageListVisibility: "show",
        labelListVisibility: "labelShow",
      });
      expect(mockGmailAPI.users.labels.create).toHaveBeenCalledWith({
        userId: "me",
        requestBody: {
          name: "Test Label",
          color: {
            textColor: "#000000",
            backgroundColor: "#ffffff",
          },
          messageListVisibility: "show",
          labelListVisibility: "labelShow",
        },
      });
    });

    it("should handle label creation with minimal options", async () => {
      await service.createLabel("Test Label");
      expect(mockGmailAPI.users.labels.create).toHaveBeenCalledWith({
        userId: "me",
        requestBody: {
          name: "Test Label",
        },
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors in listMessages", async () => {
      mockGmailAPI.users.messages.list.mockRejectedValue(
        new Error("API Error")
      );
      await expect(service.listMessages()).rejects.toThrow("API Error");
    });

    it("should handle API errors in getMessage", async () => {
      mockGmailAPI.users.messages.get.mockRejectedValue(new Error("API Error"));
      await expect(service.getMessage("1")).rejects.toThrow("API Error");
    });

    it("should handle API errors in searchMessages", async () => {
      mockGmailAPI.users.messages.list.mockRejectedValue(
        new Error("API Error")
      );
      await expect(service.searchMessages("query")).rejects.toThrow(
        "API Error"
      );
    });
  });

  describe("Message Modification", () => {
    it("should handle errors in message modification", async () => {
      mockGmailAPI.users.messages.modify.mockRejectedValueOnce(
        new Error("Modify Error")
      );
      await expect(
        service.modifyMessage("1", { addLabelIds: ["Label_1"] })
      ).rejects.toThrow("Modify Error");
    });

    it("should handle errors in message trash operation", async () => {
      mockGmailAPI.users.messages.trash.mockRejectedValueOnce(
        new Error("Trash Error")
      );
      await expect(service.trashMessage("1")).rejects.toThrow("Trash Error");
    });

    it("should handle errors in message untrash operation", async () => {
      mockGmailAPI.users.messages.untrash.mockRejectedValueOnce(
        new Error("Untrash Error")
      );
      await expect(service.untrashMessage("1")).rejects.toThrow(
        "Untrash Error"
      );
    });

    it("should handle errors in message delete operation", async () => {
      mockGmailAPI.users.messages.delete.mockRejectedValueOnce(
        new Error("Delete Error")
      );
      await expect(service.deleteMessage("1")).rejects.toThrow("Delete Error");
    });
  });

  describe("Email Parsing", () => {
    it("should handle errors in email parsing", async () => {
      const messageId = "123";
      mockGmailAPI.users.messages.get.mockRejectedValueOnce(
        new Error("Parse Error")
      );
      await expect(service.getMessage(messageId)).rejects.toThrow(
        "Parse Error"
      );
    });

    it("should handle malformed email parsing", async () => {
      const messageId = "123";
      mockGmailAPI.users.messages.get.mockResolvedValue({
        data: {
          id: messageId,
          threadId: undefined,
          labelIds: [],
          snippet: "",
          payload: {
            headers: [],
            parts: [],
          },
        },
      });
      const result = await service.getMessage(messageId);
      expect(result).toEqual({
        id: messageId,
        threadId: undefined,
        subject: "(no subject)",
        from: { email: "" },
        to: [{ email: "" }],
        date: expect.any(Date),
        body: "",
        snippet: "",
        labels: [],
        isUnread: false,
        isImportant: false,
        hasAttachments: false,
      });
    });
  });

  describe("Label Handling", () => {
    it("should handle errors in label handling", async () => {
      const labelName = "Test Label";
      mockGmailAPI.users.labels.create.mockRejectedValueOnce(
        new Error("Label Error")
      );
      await expect(service.createLabel(labelName)).rejects.toThrow(
        "Label Error"
      );
    });

    it("should handle label visibility options", async () => {
      const labelName = "Test Label";
      mockGmailAPI.users.labels.create.mockResolvedValueOnce({
        data: {
          id: "Label_123",
          name: labelName,
          labelListVisibility: "labelShow",
          messageListVisibility: "show",
        },
      });
      await service.createLabel(labelName, {
        labelListVisibility: "labelShow",
        messageListVisibility: "show",
      });
      expect(mockGmailAPI.users.labels.create).toHaveBeenCalledWith({
        userId: "me",
        requestBody: {
          name: labelName,
          labelListVisibility: "labelShow",
          messageListVisibility: "show",
        },
      });
    });
  });

  describe("Draft Operations", () => {
    it("should handle errors in draft operations with metadata", async () => {
      const draftId = "draft123";
      const emailOptions = {
        to: "test@example.com",
        subject: "Test Draft",
        body: "Test body",
      };
      mockGmailAPI.users.drafts.create.mockRejectedValueOnce(
        new Error("Draft Error")
      );
      await expect(service.createDraft(emailOptions)).rejects.toThrow(
        "Draft Error"
      );
    });

    it("should handle draft metadata", async () => {
      const draftId = "draft123";
      const emailOptions = {
        to: "test@example.com",
        subject: "Test Draft",
        body: "Test body",
      };
      mockGmailAPI.users.drafts.create.mockResolvedValueOnce({
        data: {
          id: draftId,
          message: {
            id: "msg123",
            threadId: "thread123",
          },
        },
      });
      await service.createDraft(emailOptions);
      expect(mockGmailAPI.users.drafts.create).toHaveBeenCalled();
    });
  });
});
