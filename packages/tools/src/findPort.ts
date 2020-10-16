import * as os from 'os';
import * as net from 'net';

const defaultPort = 8000;
const highestPort = 2 ** 16 - 1;

const getNextPort = (port: number) => port + 1;

function getHosts() {
  let interfaces: ReturnType<typeof os.networkInterfaces> = {};
  const addressArr: Array<string | undefined> = ['0.0.0.0']; // 默认外部可访问
  try {
    interfaces = os.networkInterfaces();
  } catch (e) {
    // As of October 2016, Windows Subsystem for Linux (WSL) does not support
    // the os.networkInterfaces() call and throws instead. For this platform,
    // assume 0.0.0.0 as the only address
    if (e.syscall === 'uv_interface_addresses') {
      // swallow error because we're just going to use defaults
      // documented @ https://github.com/nodejs/node/blob/4b65a65e75f48ff447cabd5500ce115fb5ad4c57/doc/api/net.md#L231
    } else {
      throw e;
    }
  }

  const interfaceNames = Object.keys(interfaces);

  // for (let i = 0; i < interfaceNames.length; i++) {
  //   const netInterface = interfaces[interfaceNames[i]];
  //   if (!netInterface?.length) continue;
  //   for (let j = 0; j < netInterface.length; j++) {
  //     addressArr.push(netInterface[j].address);
  //   }
  // }
  interfaceNames.forEach((interfaceName) => {
    const netInterface = interfaces[interfaceName];
    if (!netInterface?.length) return;
    for (let j = 0; j < netInterface.length; j++) {
      addressArr.push(netInterface[j].address);
    }
  });

  // add null value, For createServer function, do not use host.
  addressArr.push(undefined);

  return addressArr;
}

const hosts = getHosts();

type Option = {
  port?: number;
  host?: string;
  server?: net.Server;
  startPort?: number;
  endPort?: number;
};

type TestRes = { port: number; host: string };
async function testPort(options: Option) {
  const { port, host, server, endPort, startPort } = options;
  let currentPort = port || startPort || defaultPort;
  const testServer = server || net.createServer();
  return new Promise<TestRes | Error>(function detailTestPort(resolve, reject) {
    function reset() {
      testServer.removeListener('error', onError);
      testServer.removeListener('listening', onListen);
      testServer.close();
    }
    function onListen() {
      reset();
      resolve({
        port: currentPort,
        host: host || '0.0.0.0',
      });
    }

    function onError(err: Error & { code?: string }) {
      reset();
      if (err.code === 'EADDRINUSE') {
        console.log(`${host || '::'}:${port} in use, retrying...`);
      }
      const nextPort = getNextPort(port || defaultPort);
      currentPort = nextPort;
      if (endPort && nextPort > endPort) {
        err.message = 'No open ports available until endPort';
        reject(err);
      }
      if (nextPort > highestPort) {
        err.message = 'No open ports available';
        reject(err);
      }

      if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
        return detailTestPort(resolve, reject);
      }
      reject(err);
    }

    testServer.on('error', onError);
    testServer.on('listening', onListen);
    if (typeof host === 'string') {
      testServer.listen(currentPort, host);
    } else {
      testServer.listen(port);
    }
  });
}

async function findPort(option: number | Option) {
  let basePort = defaultPort;
  let endPort = highestPort;
  let host: undefined | string;
  if (typeof option === 'number') {
    basePort = option;
  } else {
    basePort = option?.port || option.startPort || defaultPort;
    endPort = option?.endPort || highestPort;
    host = option?.host;
  }

  // 收集可用 hosts
  if (host && !~hosts.findIndex((i) => i === host)) {
    hosts.unshift(host);
  }

  function* find() {
    for (let i = 0; i < hosts.length; i++) {
      yield testPort({
        port: basePort,
        endPort,
        host: hosts[i],
      });
    }
    throw new Error('not found');
  }

  async function loop(
    gen: Generator<Promise<TestRes | Error>>,
  ): Promise<TestRes> {
    const item = gen.next();
    if (item.done) {
      return item.value;
    }

    const v = await item.value;
    if (!(v instanceof Error)) return v;
    return loop(gen);
  }

  return loop(find());
}

// findPort({ port: 3000, host: '0.0.0.0' })
//   .then((r) => console.log('find port', r))
//   .catch((e) => console.log('catch err', e));
export { testPort };
export default findPort;
