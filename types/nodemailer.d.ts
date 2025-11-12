// Type declarations for nodemailer
// This ensures TypeScript recognizes nodemailer even if @types/nodemailer isn't found
declare module 'nodemailer' {
  export interface Transporter {
    sendMail(mailOptions: any): Promise<any>;
  }

  export interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  }

  export function createTransport(options: TransportOptions): Transporter;
  
  const nodemailer: {
    createTransport: (options: TransportOptions) => Transporter;
  };
  
  export default nodemailer;
}

