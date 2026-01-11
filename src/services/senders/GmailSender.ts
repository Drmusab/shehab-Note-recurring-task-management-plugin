import type {
  NotificationSender,
  NotificationMessage,
  GmailConfig,
} from "../types";

/**
 * GmailSender sends notifications via Gmail API
 * Note: This is a simplified implementation. Full OAuth2 flow would require additional setup.
 */
export class GmailSender implements NotificationSender {
  private config: GmailConfig;
  private accessToken: string | null = null;
  private retryCount: number = 0;
  private readonly MAX_RETRIES = 1;

  constructor(config: GmailConfig) {
    this.config = config;
  }

  async send(message: NotificationMessage): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn("Gmail sender not configured");
      return false;
    }

    try {
      // Refresh access token if needed
      if (!this.accessToken) {
        await this.refreshAccessToken();
      }

      const email = this.createEmail(message);
      const response = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            raw: btoa(email).replace(/\+/g, "-").replace(/\//g, "_"),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("Gmail API error:", error);
        
        // Try refreshing token and retry once
        if (response.status === 401 && this.retryCount < this.MAX_RETRIES) {
          this.retryCount++;
          await this.refreshAccessToken();
          return this.send(message); // Retry once
        }
        
        this.retryCount = 0;
        return false;
      }

      console.log("Gmail notification sent successfully");
      this.retryCount = 0;
      return true;
    } catch (error) {
      console.error("Failed to send Gmail notification:", error);
      this.retryCount = 0;
      return false;
    }
  }

  isConfigured(): boolean {
    return (
      this.config.enabled &&
      !!this.config.clientId &&
      !!this.config.clientSecret &&
      !!this.config.refreshToken &&
      !!this.config.recipientEmail
    );
  }

  updateConfig(config: GmailConfig): void {
    this.config = config;
    this.accessToken = null; // Reset token when config changes
  }

  private async refreshAccessToken(): Promise<void> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh Gmail access token");
    }

    const data = await response.json();
    this.accessToken = data.access_token;
  }

  private createEmail(message: NotificationMessage): string {
    const subject = `Task Reminder: ${message.taskName}`;
    const date = new Date(message.dueAt).toLocaleString();
    
    let body = `Task: ${message.taskName}\n`;
    body += `Due: ${date}\n\n`;

    if (message.payload.note) {
      body += `Note:\n${message.payload.note}\n\n`;
    }

    if (message.payload.link) {
      body += `Link: ${message.payload.link}\n\n`;
    }

    if (message.payload.media) {
      body += `Media: ${message.payload.media}\n\n`;
    }

    const email = [
      `To: ${this.config.recipientEmail}`,
      "Subject: " + subject,
      "Content-Type: text/plain; charset=utf-8",
      "",
      body,
    ].join("\n");

    return email;
  }
}
