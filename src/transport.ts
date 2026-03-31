const DEFAULT_TEAM_ORIGIN = "https://team.shiryustudios.com";
const DEFAULT_RPC_TIMEOUT_MS = 15000;

type TeamAppSdkRequestBodyType = "json" | "text" | "form-data";
type TeamAppSdkResponseDataType = "json" | "text" | "blob";

type TeamRpcMethodName =
  | "auth.getCurrentUser"
  | "auth.logout"
  | "accessControl.listUsers"
  | "accessControl.listJobs"
  | "accessControl.updateUser"
  | "accessControl.activateUser"
  | "accessControl.listAudit";

interface TeamAppSdkSerializedFile {
  filename: string;
  type?: string | null;
  base64: string;
}

interface TeamAppSdkFormDataField {
  name: string;
  value?: string;
  file?: TeamAppSdkSerializedFile;
}

export interface TeamAppSdkRequestOptions {
  path: string;
  method?: string;
  body?: string | null;
  bodyType?: TeamAppSdkRequestBodyType;
  headers?: Record<string, string>;
  formData?: TeamAppSdkFormDataField[];
}

export interface TeamAppSdkConfig {
  teamOrigin?: string;
  timeoutMs?: number;
}

export interface AccessControlUpdateUserInput {
  userId: string;
  company_email?: string | null;
  role?: string;
  status?: string;
  global_role?: string;
  job_title?: string | null;
  department?: string | null;
  job_positions?: Array<{
    title: string;
    department?: string | null;
    is_primary?: boolean;
  }>;
}

interface TeamAppSdkApiRequestMessage {
  type: "shiryu:app-sdk:request";
  requestId: string;
  method: "api.request";
  payload: TeamAppSdkRequestOptions;
}

interface TeamAppSdkRpcRequestMessage {
  type: "shiryu:app-sdk:request";
  requestId: string;
  method: "rpc.call";
  payload: {
    name: TeamRpcMethodName;
    args?: unknown;
  };
}

interface TeamAppSdkResponseMessage {
  type: "shiryu:app-sdk:response";
  requestId: string;
  ok: boolean;
  status: number;
  dataType?: TeamAppSdkResponseDataType;
  mimeType?: string;
  data?: unknown;
  error?: string;
}

export class TeamAppSdkResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly mimeType?: string;
  private readonly dataType: TeamAppSdkResponseDataType;
  private readonly payload: unknown;

  constructor(
    ok: boolean,
    status: number,
    payload: unknown,
    dataType: TeamAppSdkResponseDataType = "json",
    mimeType?: string,
  ) {
    this.ok = ok;
    this.status = status;
    this.payload = payload;
    this.dataType = dataType;
    this.mimeType = mimeType;
  }

  async json<T = unknown>() {
    return this.payload as T;
  }

  async text() {
    if (typeof this.payload === "string") return this.payload;
    if (this.dataType === "blob") {
      return (await this.blob()).text();
    }
    return JSON.stringify(this.payload ?? null);
  }

  async blob() {
    if (this.payload instanceof Blob) return this.payload;
    if (this.dataType === "blob" && typeof this.payload === "string") {
      return new Blob([decodeBase64ToUint8Array(this.payload)], {
        type: this.mimeType || "application/octet-stream",
      });
    }
    if (typeof this.payload === "string") {
      return new Blob([this.payload], {
        type: this.mimeType || "text/plain",
      });
    }
    return new Blob([JSON.stringify(this.payload ?? null)], {
      type: this.mimeType || "application/json",
    });
  }
}

function getParentOrigin(teamOrigin: string) {
  try {
    return document.referrer ? new URL(document.referrer).origin : teamOrigin;
  } catch {
    return teamOrigin;
  }
}

function supportsParentSdk() {
  return typeof window !== "undefined" && window.parent !== window;
}

function createRequestId() {
  return `sdk_${crypto.randomUUID()}`;
}

function encodeArrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function decodeBase64ToUint8Array(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function serializeHeaders(headers?: HeadersInit) {
  if (!headers) return undefined;
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
}

async function serializeRequestOptions(
  path: string,
  options: RequestInit,
): Promise<TeamAppSdkRequestOptions> {
  const method = options.method || "GET";
  const headers = serializeHeaders(options.headers);
  const body = options.body;

  if (body instanceof FormData) {
    const formData: TeamAppSdkFormDataField[] = [];
    for (const [name, value] of body.entries()) {
      if (typeof value === "string") {
        formData.push({ name, value });
        continue;
      }
      formData.push({
        name,
        file: {
          filename: value.name,
          type: value.type || null,
          base64: encodeArrayBufferToBase64(await value.arrayBuffer()),
        },
      });
    }
    return {
      path,
      method,
      headers,
      bodyType: "form-data",
      formData,
    };
  }

  if (typeof body === "string") {
    return {
      path,
      method,
      headers,
      bodyType: "text",
      body,
    };
  }

  return {
    path,
    method,
    headers,
    body:
      body == null
        ? null
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
    bodyType: body == null ? undefined : "json",
  };
}

function isResponseForRequest(
  event: MessageEvent,
  parentOrigin: string,
  requestId: string,
) {
  if (event.origin !== parentOrigin) return false;
  const payload = event.data as TeamAppSdkResponseMessage | null;
  return Boolean(
    payload &&
      payload.type === "shiryu:app-sdk:response" &&
      payload.requestId === requestId,
  );
}

export function createTeamAppSdk(config: TeamAppSdkConfig = {}) {
  const teamOrigin = config.teamOrigin || DEFAULT_TEAM_ORIGIN;
  const timeoutMs = config.timeoutMs || DEFAULT_RPC_TIMEOUT_MS;

  function sendMessage(
    message: TeamAppSdkApiRequestMessage | TeamAppSdkRpcRequestMessage,
  ) {
    if (!supportsParentSdk()) {
      throw new Error("This app must be opened from Shiryu Team.");
    }

    const parentOrigin = getParentOrigin(teamOrigin);

    return new Promise<TeamAppSdkResponse>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        window.removeEventListener("message", handleMessage);
        reject(
          new Error("Shiryu Team did not respond to the app SDK request."),
        );
      }, timeoutMs);

      function handleMessage(event: MessageEvent) {
        if (!isResponseForRequest(event, parentOrigin, message.requestId)) {
          return;
        }

        const payload = event.data as TeamAppSdkResponseMessage;
        window.clearTimeout(timeout);
        window.removeEventListener("message", handleMessage);

        if (!payload.ok && payload.error && payload.data === undefined) {
          resolve(
            new TeamAppSdkResponse(
              false,
              payload.status,
              { error: payload.error },
              payload.dataType,
              payload.mimeType,
            ),
          );
          return;
        }

        resolve(
          new TeamAppSdkResponse(
            payload.ok,
            payload.status,
            payload.data,
            payload.dataType,
            payload.mimeType,
          ),
        );
      }

      window.addEventListener("message", handleMessage);
      window.parent.postMessage(message, parentOrigin);
    });
  }

  async function request(
    path: string,
    options: RequestInit = {},
  ): Promise<TeamAppSdkResponse> {
    const message: TeamAppSdkApiRequestMessage = {
      type: "shiryu:app-sdk:request",
      requestId: createRequestId(),
      method: "api.request",
      payload: await serializeRequestOptions(path, options),
    };

    return sendMessage(message);
  }

  async function rpc<T = unknown>(
    name: TeamRpcMethodName,
    args?: unknown,
  ): Promise<T> {
    const response = await sendMessage({
      type: "shiryu:app-sdk:request",
      requestId: createRequestId(),
      method: "rpc.call",
      payload: { name, args },
    });

    const payload = await response.json<{ error?: string } | T>();
    if (!response.ok) {
      throw new Error(
        typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
          ? payload.error
          : `Team RPC failed for ${name}.`,
      );
    }

    return payload as T;
  }

  async function getCurrentUser() {
    return rpc<Record<string, unknown>>("auth.getCurrentUser");
  }

  async function logout() {
    await rpc("auth.logout");
  }

  function createApiFetch(onUnauthorized?: () => void) {
    return async (path: string, options: RequestInit = {}) => {
      const response = await request(
        path.startsWith("http://") || path.startsWith("https://")
          ? path
          : `${path.startsWith("/") ? path : `/${path}`}`,
        options,
      );

      if (response.status === 401) {
        onUnauthorized?.();
        throw new Error("Session expired");
      }

      return response;
    };
  }

  const accessControl = {
    listUsers: () => rpc<Array<Record<string, unknown>>>("accessControl.listUsers"),
    listJobs: () => rpc<Array<Record<string, unknown>>>("accessControl.listJobs"),
    updateUser: (input: AccessControlUpdateUserInput) =>
      rpc<Record<string, unknown>>("accessControl.updateUser", input),
    activateUser: (userId: string) =>
      rpc<Record<string, unknown>>("accessControl.activateUser", { userId }),
    listAudit: (params?: Record<string, string | number | boolean | undefined>) =>
      rpc<Array<Record<string, unknown>>>("accessControl.listAudit", params),
  };

  return {
    request,
    rpc,
    getCurrentUser,
    logout,
    createApiFetch,
    accessControl,
  };
}

export function createTeamWidgetSdk(config: TeamAppSdkConfig = {}) {
  return createTeamAppSdk(config);
}
