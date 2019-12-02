'use strict'

const path = require('path');
const child = require('child_process');
const readline = require('readline');
const EventEmitter = require('events');

const BINARY_PATH = path.join(__dirname, 'bin', 'xmrig');

class XMRig extends EventEmitter {
    /**
     * Creates an instance of XMRig
     * @param {object} options
     * @param {string} options.poolUrl
     * @param {string} options.wallet
     * @param {string} options.algorithm
     * @param {string} options.threads
     */
    constructor(options) {
        super();
        this.private = {
            _options: options
        };
        this.init();
    }

    init() {
        this.freeListeners();
        this.exe = child.spawn(BINARY_PATH, [
            '-o',
            this.private._options.poolUrl,
            '-u',
            this.private._options.wallet,
            '-a',
            this.private._options.algorithm,
            '-t',
            this.private._options.threads,
            '--donate-level=1'
        ]);

        this.exe.once('exit', (code, signal) => {
            this.exe.removeAllListeners('exit');
            this.emit('exit', { code: code, signal: signal });
        });

        this.exe.stdout.setEncoding(this.private._options.outputEncoding);
        this.rlStdout = readline.createInterface({
            input: this.exe.stdout
        });
        this.rlStdout.on('line', (line) => {
            this.emit('stdout', line);
        });

        this.exe.stderr.setEncoding(this.private._options.outputEncoding);
        this.rlStderr = readline.createInterface({
            input: this.exe.stderr
        });
        this.rlStderr.on('line', (line) => {
            this.emit('stderr', line);
        });
    }

    freeListeners() {
        if (this.exe) {
            this.exe.removeAllListeners('error');
            this.exe.removeAllListeners('exit');
            this.exe.removeAllListeners('message');
        }
        if (this.rlStdout) {
            this.rlStdout.removeAllListeners('line');
        }
        if (this.rlStderr) {
            this.rlStderr.removeAllListeners('line');
        }
    }

    exit(signal = 'SIGTERM') {
        this.freeListeners();
        this.exe.kill(signal);
    }
}

module.exports = XMRig;

