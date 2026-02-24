import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createBridgeGateway } from "../gateway/createBridgeGateway.js";
import type { Gateway, GatewayOptions } from "../gateway/types.js";

export interface StartBridgeBunServerOptions extends GatewayOptions {
  port: number;
  host?: string;
  requestHandler?: (
    req: IncomingMessage,
    res: ServerResponse<IncomingMessage>,
  ) => void | Promise<void>;
}

export interface BridgeBunServer {
  gateway: Gateway;
  close: () => Promise<void>;
}

export async function startBridgeBunServer(
  options: StartBridgeBunServerOptions,
): Promise<BridgeBunServer> {
  const gateway = createBridgeGateway(options);
  const server = createServer(async (req, res) => {
    if (!options.requestHandler) {
      res.statusCode = 404;
      res.end("Not Found");
      return;
    }

    try {
      await options.requestHandler(req, res);
    } catch (error) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end(
        error instanceof Error ? error.message : "Internal Server Error",
      );
    }
  });

  gateway.attach(server);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port, options.host ?? "0.0.0.0", () => {
      server.off("error", reject);
      resolve();
    });
  });

  return {
    gateway,
    close: async () => {
      gateway.destroy();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}
