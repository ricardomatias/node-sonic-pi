const os = require('os');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const OSC = require('osc-js');

const COWBELL_SCRIPT = fs.readFileSync(path.join(process.cwd(), 'cowbell.rb'), { encoding: 'utf8' });

const SONIC_PI_PATHS = [
  '/Applications/Sonic Pi.app/server/bin/sonic-pi-server.rb',
  '/Applications/Sonic Pi.app/app/server/ruby/bin/sonic-pi-server.rb',
  // './app/server/bin/sonic-pi-server.rb',
  // '/opt/sonic-pi/app/server/bin/sonic-pi-server.rb',
  // '/usr/lib/sonic-pi/server/bin/sonic-pi-server.rb',
  // '/opt/sonic-pi/app/server/ruby/bin/sonic-pi-server.rb',
  // '/usr/lib/sonic-pi/server/ruby/bin/sonic-pi-server.rb',
];

const SONIC_PI = '/Applications/Sonic Pi.app/app/server/ruby/bin/sonic-pi-server.rb';

const HOME_DIR = os.homedir();

// if (HOME_DIR) {
//   SONIC_PI_PATHS.push(path.join(HOME_DIR, SONIC_PI));
// }

const GUI_ID = 10;
const SONIC_PI_PORT = 4557;

class SonicPi {
  init() {
    this.osc = new OSC({
      plugin: new OSC.DatagramPlugin({ send: { port: SONIC_PI_PORT } })
    });

    this.osc.open({ port: 4558 });
  }

  stopAllCode() {
    const msg = new OSC.Message('/stop-all-jobs', GUI_ID);

    this.osc.send(msg);
  }

  runCode(code) {
    const msg = new OSC.Message('/run-code', GUI_ID, code);

    this.osc.send(msg);
  }

  dispose() {
    this.osc.close();
  }
}

const SUCCESS_MSG = 'Sonic Pi Server successfully booted.';
const reg = new RegExp(SUCCESS_MSG, 'ig');
let sonicPi, sonicServer;

try {
  sonicPi = new SonicPi();

  sonicServer = spawn(SONIC_PI);

  console.log(`Spawned SONIC_PI pid: ${sonicServer.pid}`);

  sonicServer.stdout.on('data', (data) => {

    console.log(`stdout: ${data}`);

    if (reg.test(data)) {
      sonicPi.init();

      setInterval(() => (sonicPi.runCode('play 75')), 1000);
    }
  });

  sonicServer.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  sonicServer.on('close', (code, signal) => {
    console.log(`SONIC_PI exited with code: ${code} and signal: ${signal}`);
  });
} catch (err) {
  console.error(err);
  sonicServer.kill();
}

function sendCode() {
  const client = new osc.Client('127.0.0.1', 4557);
  const runCodeMsg = new osc.Message('/run-code');

  runCodeMsg.append(COWBELL_SCRIPT);

  client.send(runCodeMsg, function() {
    client.kill();
  });
}


