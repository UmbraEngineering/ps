# ps

A Node.js module for looking up running processes.

## Install

```bash
$ npm install ps
```

## Usage

```javascript
const ps = require('ps');

const [ proc ] = await ps({ pid: 12345 });

console.log(proc); // { "pid": 12345, "comm": "node" }

const procs = await ps({ pid: [ 23456, 34567 ] });

console.log(procs); // [ { "pid": 23456, "comm": "node" }, { "pid": 34567, "comm": "node" }

// Available options
{
    pid: 12345 || [ 23456, 34567 ],  // Search by pid
    ppid: 12345 || [ 23456, 34567 ],  // Search by parent pid
    user: "bob",  // Search by user
    group: "users",  // Search by group
    command: "node",  // Search by command
    all: true,  // List all processes
    fields: [ 'pid', 'comm' ]  // The fields to return
}
```

