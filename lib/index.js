
const { spawn } = require('child_process');

const whitespace = /\s+/;

const validFields = new Set([
	'group', 'ppid', 'user', 'args', 'comm', 'rgroup', 'nice', 'pid', 'pgid', 'etime',
	'ruser', 'time', 'tty', 'vsz'
]);

const lookup = async ({ pid, ppid, user, group, command, all, fields = ['pid', 'ppid', 'comm'] }) => {
	if (! fields.every((field) => validFields.has(field))) {
		throw new Error('ps - invalid field provided');
	}

	if (ppid && fields.indexOf('ppid') < 0) {
		fields.push('ppid');
	}

	const fieldOptions = fields.reduce(reduceFieldsToOptions, [ ]);

	if (pid) {
		const output = await ps([ '-p', processPids(pid), ...fieldOptions ]);

		return parseGrid(output);
	}

	if (ppid) {
		const pids = processPids(ppid);
		const ppidSet = new Set(String(pids).split(','));
		const output = await ps([ '-p', pids, ...fieldOptions ]);
		const processes = parseGrid(output);

		return processes.filter((proc) => {
			return ppidSet.has(proc.ppid);
		});
	}

	if (all) {
		const output = await ps([ '-e', ...fieldOptions ]);

		return parseGrid(output);
	}

	if (user) {
		const output = await ps([ '-u', user, ...fieldOptions ]);

		return parseGrid(output);
	}

	if (group) {
		const output = await ps([ '-g', group, ...fieldOptions ]);

		return parseGrid(output);
	}

	if (command) {
		const output = await ps([ '-C', command, ...fieldOptions ]);

		return parseGrid(output);
	}

	throw new Error('ps - must provide a search query; one of "pid", "ppid", "all", "user", "group", "command"');
};

// Export
module.exports = lookup;
lookup.lookup = lookup;

class Process {
	constructor(fields) {
		Object.assign(this, fields);
		Object.freeze(this);
	}
}

// Turns ['comm', 'pid'] into ['-o', 'comm', '-o', 'pid']
const reduceFieldsToOptions = (options, field) => {
	options.push('-o', field);

	return options;
};

const ps = (args, callback) => {
	return new Promise((resolve, reject) => {
		const child = spawn('ps', args);

		let stdout = '';
		let stderr = '';

		child.on('error', (error) => {
			reject(error);
		});

		child.stdout.on('data', (data) => stdout += data);
		child.stderr.on('data', (data) => stderr += data);

		child.on('close', (code) => {
			stderr = stderr.trim();

			if (stderr) {
				return reject(new Error(stderr));
			}

			resolve(stdout.trim());
		});
	});
};

const isValidPid = (pid) => {
	const int = parseInt(pid, 10);

	return ! isNaN(int) && String(int) === String(pid);
};

const processPids = (pid) => {
	if (Array.isArray(pid)) {
		if (! pid.every(isValidPid)) {
			throw new Error('ps - pid must be a valid integer value');
		}

		return pid.join(',');
	}

	if (! isValidPid(pid)) {
		throw new Error('ps - pid must be a valid integer value');
	}

	return pid;
}

// Parses the resulting output from ps into `Process` objects
const parseGrid = (output) => {
	if (! output) {
		return [ ];
	}

	const lines = output.split('\n');
	const header = lines.shift()
		.trim()
		.split(whitespace)
		.map((col) => col.toLowerCase());

	return lines.map((line) => {
		const proc = { };

		line.trim().split(whitespace).forEach((item, index) => {
			if (item) {
				proc[header[index]] = item;
			}
		});
		
		return new Process(proc);
	});
};
