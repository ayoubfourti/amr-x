import http from "node:http";
import net from "node:net";

const listenHost = "0.0.0.0";
const listenPort = 3000;

const website = { host: "127.0.0.1", port: 3001, name: "website" };
const documentation = { host: "127.0.0.1", port: 8001, name: "documentation" };

function targetFor(url = "/") {
  const pathname = new URL(url, "http://localhost").pathname;
  if (
    pathname === "/docs" ||
    pathname.startsWith("/docs/") ||
    pathname.startsWith("/livereload/")
  ) {
    return documentation;
  }
  return website;
}

function isExpectedDisconnect(error) {
  return ["ECONNRESET", "EPIPE", "ERR_STREAM_PREMATURE_CLOSE"].includes(
    error?.code,
  );
}

function headersFor(target, requestHeaders) {
  const originalHost = requestHeaders.host ?? "localhost:3000";
  const headers = {
    ...requestHeaders,
    "x-forwarded-host": originalHost,
    "x-forwarded-proto": "http",
  };

  // Next.js is intentionally loopback-only behind this gateway. Normalize
  // browser origin metadata to that trusted upstream while retaining the
  // contributor-facing host in X-Forwarded-Host.
  if (target === website) {
    headers.host = `${website.host}:${website.port}`;
    if (headers.origin) headers.origin = `http://${website.host}:${website.port}`;
    if (headers.referer) {
      const referer = new URL(headers.referer);
      referer.host = `${website.host}:${website.port}`;
      headers.referer = referer.toString();
    }
  }

  return headers;
}

const server = http.createServer((request, response) => {
  const target = targetFor(request.url);
  const headers = headersFor(target, request.headers);

  const upstream = http.request(
    {
      host: target.host,
      port: target.port,
      method: request.method,
      path: request.url,
      headers,
    },
    (upstreamResponse) => {
      response.writeHead(
        upstreamResponse.statusCode ?? 502,
        upstreamResponse.statusMessage,
        upstreamResponse.headers,
      );
      upstreamResponse.pipe(response);
    },
  );

  upstream.on("error", (error) => {
    if (isExpectedDisconnect(error) || request.destroyed || response.destroyed) {
      return;
    }

    console.error(`Unable to reach the local ${target.name} server:`, error.message);
    if (!response.headersSent) {
      response.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    }
    response.end(`${target.name} server is not ready\n`);
  });

  request.on("aborted", () => upstream.destroy());
  response.on("close", () => {
    if (!response.writableEnded) upstream.destroy();
  });
  request.pipe(upstream);
});

// Pass WebSocket upgrades through to Next.js so development HMR remains live.
server.on("upgrade", (request, socket, head) => {
  const target = targetFor(request.url);
  const headers = headersFor(target, request.headers);
  const upstream = net.connect(target.port, target.host, () => {
    const lines = [`${request.method} ${request.url} HTTP/${request.httpVersion}`];
    for (const [name, value] of Object.entries(headers)) {
      if (value !== undefined) {
        lines.push(`${name}: ${Array.isArray(value) ? value.join(", ") : value}`);
      }
    }
    upstream.write(`${lines.join("\r\n")}\r\n\r\n`);
    if (head.length) upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });

  const closeQuietly = () => {
    socket.destroy();
    upstream.destroy();
  };
  upstream.on("error", closeQuietly);
  socket.on("error", closeQuietly);
});

server.on("clientError", (error, socket) => {
  if (!isExpectedDisconnect(error) && socket.writable) {
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
  } else {
    socket.destroy();
  }
});

server.listen(listenPort, listenHost, () => {
  console.log(`AMR-X local gateway ready at http://localhost:${listenPort}`);
});
