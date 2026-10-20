export declare const createEmailTransporter: () => import("nodemailer").Mail<import("nodemailer").SMTPSentMessageInfo, import("nodemailer").SMTPTransportOptions>;
export declare const emailTransporter: import("nodemailer").Mail<import("nodemailer").SMTPSentMessageInfo, import("nodemailer").SMTPTransportOptions>;
export declare const emailTemplates: {
    orderConfirmation: (orderNumber: string, customerName: string, total: number) => {
        subject: string;
        html: string;
        text: string;
    };
    orderStatusUpdate: (orderNumber: string, customerName: string, status: string, message: string) => {
        subject: string;
        html: string;
        text: string;
    };
    newOrderVendor: (orderNumber: string, vendorName: string, itemCount: number, total: number) => {
        subject: string;
        html: string;
        text: string;
    };
    passwordReset: (resetToken: string, userName: string) => {
        subject: string;
        html: string;
        text: string;
    };
};
export declare const sendEmail: (to: string, template: {
    subject: string;
    html: string;
    text: string;
}) => Promise<{
    success: boolean;
    messageId: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    messageId?: undefined;
}>;
//# sourceMappingURL=email.d.ts.map