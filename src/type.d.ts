declare namespace fhook {
  interface Request {
    method: string;
    url: string;
    body: string;
    headers: Record<string, string>;
    timeout: number;
    type: string;
    withCredentials: boolean;
  }

  type ResponseType = ArrayBuffer | Document | Blob | object | string;

  interface Response {
    status: number;
    statusText: string;
    text: string;
    headers: Record<string, string>;
    xml: XMLDocument;
    data: ResponseType;
  }

  interface BeforeHandler {
    (
      request: Request,
      callback: (response?: Response) => void
    ): Response | void;
  }

  interface AfterHandler {
    (request: Request, response: Response, callback: () => void): void;
  }
}

declare const fhook: {
  enable: () => void;
  disable: () => void;
  before: (handler: fhook.BeforeHandler, index?: number) => void;
  after: (handler: fhook.AfterHandler, index?: number) => void;
};

export = fhook;
